import type { Plugin } from 'vite';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { compileFromFile } from 'json-schema-to-typescript';

const SYFT_JSON_SCHEMA_URL =
  'https://raw.githubusercontent.com/anchore/syft/refs/heads/main/schema/json/schema-latest.json';

export function syftJSONSchema(): Plugin {
  return {
    name: 'vite-plugin-syft-json-schema',
    enforce: 'pre',
    configResolved: async (resolved): Promise<void> => {
      const generated = join(resolved.root, 'generated');
      await mkdir(generated, { recursive: true });

      const schemaPath = join(generated, 'syft-schema.json');

      const response = await fetch(SYFT_JSON_SCHEMA_URL);

      const content = await response.json();

      // delete the root `$ref`
      // https://github.com/bcherny/json-schema-to-typescript/issues/132
      delete content['$ref'];

      await writeFile(schemaPath, JSON.stringify(content, undefined, 2), 'utf-8');

      // compile from file
      const output = await compileFromFile(schemaPath, {
        unreachableDefinitions: true,
      });

      await writeFile(join(generated, 'syft-schema.d.ts'), output, 'utf-8');
    },
  };
}
