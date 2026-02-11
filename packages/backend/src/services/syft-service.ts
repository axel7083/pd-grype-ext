/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/
import type {
  Disposable,
  cli as cliApi,
  CliTool,
  Logger,
  QuickPickItem,
  env as envApi,
  window as windowApi,
  process as processApi,
} from '@podman-desktop/api';
import type { AsyncInit } from '../utils/async-init';
import type { Octokit } from '@octokit/rest';
import { platform, arch } from 'node:process';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import * as tar from 'tar';
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

interface Dependencies {
  cliApi: typeof cliApi;
  octokit: Octokit;
  storagePath: string;
  envApi: typeof envApi;
  window: typeof windowApi;
  process: typeof processApi;
}

export interface SyftGithubReleaseArtifactMetadata extends QuickPickItem {
  tag: string;
  id: number;
}

export const ANCHOR_GITHUB_ORG = 'anchore';
export const GRYPE_GITHUB_REPOSITORY = 'syft';

export class SyftService implements Disposable, AsyncInit {
  #cliTool?: CliTool;

  constructor(protected dependencies: Dependencies) {}

  dispose(): void {
    this.#cliTool?.dispose();
  }

  protected async getSyftVersion(path: string): Promise<string> {
    // output example 'syft 1.41.2'
    const { stdout } = await this.dependencies.process.exec(path , ['--version']);
    return stdout.trim().split(' ')[1];
  }

  async init(): Promise<void> {
    let version: string | undefined;

    const internal = join(this.dependencies.storagePath, this.dependencies.envApi.isWindows ? 'syft.exe' : 'syft');
    if (existsSync(internal)) {
      version = await this.getSyftVersion(internal);
    }

    // Register the Syft CLI tool. For now, only registration is performed without installers or updates.
    this.#cliTool = this.dependencies.cliApi.createCliTool({
      name: 'syft',
      displayName: 'Syft',
      markdownDescription: 'Syft is a powerful open-source tool for generating Software Bills of Materials (SBOMs).',
      images: {
        // Use the extension icon by default. Podman Desktop will resolve it relative to the extension.
        icon: 'icon.png',
        logo: 'icon.png',
      },
      version,
      installationSource: 'extension',
      path: internal,
    });

    let selected: SyftGithubReleaseArtifactMetadata | undefined = undefined;
    this.#cliTool?.registerInstaller({
      doUninstall(logger: Logger): Promise<void> {
        throw new Error('Not implemented');
      },
      doInstall: async (logger: Logger) => {
        if (!selected) throw new Error('No version selected');

        const assetPath = await this.download(selected);
        logger.log(`Downloaded syft to ${assetPath}`);

        try {
          const binPath = await this.extract(assetPath, this.dependencies.storagePath);
          logger.log(`Extracted syft to ${binPath}`);

          this.#cliTool?.updateVersion({
            version: selected.tag.slice(1),
            path: binPath,
            installationSource: 'extension',
          });
        } finally {
          await rm(assetPath);
        }
      },
      selectVersion: async (latest?: boolean) => {
        selected = await this.promptUserForVersion();
        return selected.tag.slice(1); // remove `v` prefix
      },
    });
  }

  protected async download(release: SyftGithubReleaseArtifactMetadata): Promise<string> {
    const { data } = await this.dependencies.octokit.repos.listReleaseAssets({
      owner: ANCHOR_GITHUB_ORG,
      repo: GRYPE_GITHUB_REPOSITORY,
      release_id: release.id,
    });

    const assetName = this.getAssetName(release.tag.slice(1));

    const asset = data.find(asset => assetName === asset.name);
    if (!asset) throw new Error(`asset ${assetName} not found`);

    const response = await this.dependencies.octokit.repos.getReleaseAsset({
      owner: ANCHOR_GITHUB_ORG,
      repo: GRYPE_GITHUB_REPOSITORY,
      asset_id: asset.id,
      headers: {
        accept: 'application/octet-stream',
      },
    });

    await mkdir(this.dependencies.storagePath, { recursive: true });

    // write the file
    const destination = join(this.dependencies.storagePath, asset.name);
    await writeFile(destination, Buffer.from(response.data as unknown as ArrayBuffer));

    return destination;
  }

  protected async extract(archivePath: string, destDir: string): Promise<string> {
    if (archivePath.endsWith('.zip')) {
      const zip = new AdmZip(archivePath);
      // eslint-disable-next-line sonarjs/no-unsafe-unzip
      zip.extractAllTo(destDir, true);
    } else if (archivePath.endsWith('.tar.gz')) {
      // eslint-disable-next-line sonarjs/no-unsafe-unzip
      await tar.x({ file: archivePath, cwd: destDir });
    } else {
      throw new Error(`Unsupported archive format: ${archivePath}`);
    }

    const binaryName = platform === 'win32' ? 'syft.exe' : 'syft';
    const binaryPath = join(destDir, binaryName);

    if (platform !== 'win32') {
      // eslint-disable-next-line sonarjs/file-permissions
      await chmod(binaryPath, 0o755);
    }

    return binaryPath;
  }

  protected getAssetName(version: string): string {
    let os: string;
    let extension = 'tar.gz';

    switch (platform) {
      case 'win32':
        os = 'windows';
        extension = 'zip';
        break;
      case 'darwin':
        os = 'darwin';
        break;
      case 'linux':
      default:
        os = 'linux';
        break;
    }

    let architecture: string;
    switch (arch) {
      case 'x64':
        architecture = 'amd64';
        break;
      case 'arm64':
        architecture = 'arm64';
        break;
      case 'ppc64':
        architecture = 'ppc64le';
        break;
      case 's390x':
        architecture = 's390x';
        break;
      default:
        architecture = arch;
        break;
    }

    return `syft_${version}_${os}_${architecture}.${extension}`;
  }

  protected async promptUserForVersion(currentTagVersion?: string): Promise<SyftGithubReleaseArtifactMetadata> {
    // Get the latest releases
    let lastReleasesMetadata = await this.listReleases();
    // if the user already has an installed version, we remove it from the list
    if (currentTagVersion) {
      lastReleasesMetadata = lastReleasesMetadata.filter(release => release.tag.slice(1) !== currentTagVersion);
    }

    // Show the quickpick
    const selectedRelease = await this.dependencies.window.showQuickPick(lastReleasesMetadata, {
      placeHolder: 'Select Syft version to download',
    });

    if (selectedRelease) {
      return selectedRelease;
    } else {
      throw new Error('No version selected');
    }
  }

  protected async listReleases(limits = 10): Promise<SyftGithubReleaseArtifactMetadata[]> {
    const lastReleases = await this.dependencies.octokit.repos.listReleases({
      owner: ANCHOR_GITHUB_ORG,
      repo: GRYPE_GITHUB_REPOSITORY,
    });

    // keep only releases and not pre-releases
    lastReleases.data = lastReleases.data.filter(release => !release.prerelease);

    if (lastReleases.data.length > limits) {
      lastReleases.data = lastReleases.data.slice(0, limits);
    }

    return lastReleases.data.map(release => {
      return {
        label: release.name ?? release.tag_name,
        tag: release.tag_name,
        id: release.id,
      };
    });
  }
}
