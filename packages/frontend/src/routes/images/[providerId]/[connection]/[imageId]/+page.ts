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
import type { PageLoad } from './$types';
import type { Document } from '@podman-desktop/extension-grype-core-api/json-schema/syft';
import { imageAPI, syftAPI } from '/@/api/client';
import type {
  ProviderContainerConnectionIdentifierInfo,
  SimpleImageInfo,
} from '@podman-desktop/extension-grype-core-api';

interface Data {
  analysis: Promise<Document>;
  image: Promise<SimpleImageInfo>;
}

export const load: PageLoad = async ({ params }): Promise<Data> => {
  const connection: ProviderContainerConnectionIdentifierInfo = {
    name: decodeURIComponent(params.connection),
    providerId: decodeURIComponent(params.providerId),
  };
  const imageId = decodeURIComponent(params.imageId);

  return {
    image: imageAPI.inspect({
      connection,
      imageId,
    }),
    analysis: syftAPI.analyse({
      connection,
      imageId,
    }),
  };
};
