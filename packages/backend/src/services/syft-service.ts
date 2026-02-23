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
import type { Disposable, ProviderContainerConnection } from '@podman-desktop/api';
import { ProgressLocation } from '@podman-desktop/api';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir, rename } from 'node:fs/promises';
import type { PodmanService } from './podman-service';
import { AnchoreCliService, type BaseCliDependencies } from './anchore-cli-service';

interface Dependencies extends BaseCliDependencies {
  podman: PodmanService;
}

export class SyftService extends AnchoreCliService<Dependencies> implements Disposable {
  protected override get icon(): string {
    return 'syft.png';
  }
  protected get toolId(): string {
    return 'syft';
  }
  protected get displayName(): string {
    return 'Syft';
  }
  protected get markdownDescription(): string {
    return 'Syft is a powerful open-source tool for generating Software Bills of Materials (SBOMs).';
  }
  protected get repoName(): string {
    return 'syft';
  }

  protected sanitizeImageId(imageId: string): string {
    if (imageId.startsWith('sha256:')) {
      return imageId.substring(7);
    }
    return imageId;
  }

  public async analyse(options: { connection: ProviderContainerConnection; imageId: string }): Promise<string> {
    if (!this.cliTool?.version || !this.cliTool.path)
      throw new Error('cannot analyse image without syft binary installed');

    const binary = this.cliTool.path;

    if (options.connection.connection.type !== 'podman') {
      throw new Error('extension only supported podman connection');
    }

    const imageId = this.sanitizeImageId(options.imageId);

    const destination = join(
      this.dependencies.storagePath,
      options.connection.providerId,
      options.connection.connection.name,
      `${imageId}.jsonpow`,
    );

    // shortcut everything if we have already done the scanning
    if (existsSync(destination)) {
      return destination;
    }

    return await this.dependencies.window.withProgress(
      {
        location: ProgressLocation.TASK_WIDGET,
        title: `Scanning ${imageId}`,
      },
      async () => {
        // list podman connections
        const connection = await this.dependencies.podman.findPodmanConnection(options.connection);
        if (!connection && !this.dependencies.envApi.isLinux) {
          throw new Error('podman connection not found');
        }

        const env: Record<string, string> = {};
        if (connection) {
          // only support SSH
          if (!connection.URI.startsWith('ssh:')) {
            throw new Error('do not support non-SSH connections');
          }

          env['CONTAINER_HOST'] = connection.URI;
          if (connection.Identity) {
            env['CONTAINER_SSHKEY'] = connection.Identity;
          }
        }

        await mkdir(dirname(destination), { recursive: true });

        const tmp = `${destination}.tmp`;

        await this.dependencies.process.exec(binary, ['--from=podman', options.imageId, `--output=json=${tmp}`], {
          env,
        });
        await rename(tmp, destination);

        return destination;
      },
    );
  }
}
