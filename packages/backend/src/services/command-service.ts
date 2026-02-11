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
import type { commands as commandsApi, Disposable } from '@podman-desktop/api';
import { RoutingService } from './routing-service';
import { AsyncInit } from '../utils/async-init';

interface Dependencies {
  commandsApi: typeof commandsApi;
  routing: RoutingService;
}

export class CommandService implements Disposable, AsyncInit {
  #disposables: Disposable[] = [];

  constructor(private dependencies: Dependencies) {}

  dispose(): void {}

  async init(): Promise<void> {
    this.dependencies.commandsApi.registerCommand('syft.analysis', async () => {
      console.log('doing stuff from within command');
    });

    return Promise.resolve(undefined);
  }
}
