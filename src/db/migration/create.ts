import * as fs from 'fs/promises';
import * as path from 'path';

const { dirname } = import.meta;

const date = new Date()
  .toISOString()
  .substring(0, 19)
  .replace('T', '_')
  .replaceAll(':', '');

const template = await fs.readFile(path.join(dirname, 'template.ts'), {
  encoding: 'utf-8',
});

await fs.writeFile(
  path.join(dirname, '../../migration', `${date}.ts`),
  template
);
