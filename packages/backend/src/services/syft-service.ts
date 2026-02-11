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
} from '@podman-desktop/api';
import type { AsyncInit } from '../utils/async-init';
import type { Octokit } from '@octokit/rest';
import { platform, arch } from 'node:process';

interface Dependencies {
  cliApi: typeof cliApi;
  octokit: Octokit;
  storagePath: string;
  envApi: typeof envApi;
  window: typeof windowApi;
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

  async init(): Promise<void> {
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
    });

    let selected: SyftGithubReleaseArtifactMetadata | undefined = undefined;
    this.#cliTool?.registerInstaller({
      doUninstall(logger: Logger): Promise<void> {
        throw new Error('Not implemented');
      },
      doInstall: async (logger: Logger) => {
        if(!selected) throw new Error('No version selected');

        const { data } = await this.dependencies.octokit.repos.listReleaseAssets({
          owner: ANCHOR_GITHUB_ORG,
          repo: GRYPE_GITHUB_REPOSITORY,
          release_id: selected.id,
        });

        const assetName = this.getAssetName(selected.tag.slice(1));

        const asset = data.find((asset) => assetName === asset.name);
        if(!asset) throw new Error(`asset ${assetName} not found`);

        console.log('Found asset', asset.id);
      },
      selectVersion: async (latest?: boolean) => {
        selected = await this.promptUserForVersion();
        return selected.tag.slice(1); // remove `v` prefix
      },
    });
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

    if(lastReleases.data.length > limits) {
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
