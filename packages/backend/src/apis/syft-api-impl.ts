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
import type { ProviderContainerConnectionIdentifierInfo } from '@podman-desktop/extension-grype-core-api';
import type { Document } from '@podman-desktop/extension-grype-core-api/json-schema/syft';
import { SyftApi } from '@podman-desktop/extension-grype-core-api';
import type { SyftService } from '../services/syft-service';
import type { ProviderService } from '../services/provider-service';
import { readFile } from 'node:fs/promises';

interface Dependencies {
  syft: SyftService;
  provider: ProviderService;
}

export class SyftApiImpl extends SyftApi {
  constructor(protected dependencies: Dependencies) {
    super();
  }

  override async analyse(options: {
    connection: ProviderContainerConnectionIdentifierInfo;
    imageId: string;
  }): Promise<Document> {
    const connection = this.dependencies.provider.getProviderContainerConnection(options.connection);

    try {
      const file = await this.dependencies.syft.analyse({
        connection: connection,
        imageId: options.imageId,
      });
      const result = await readFile(file, 'utf8');
      return JSON.parse(result);
    } catch (err: unknown) {
      console.error(err);
      throw err;
    }
  }
}
