import * as fs from 'fs/promises';
import * as path from 'path';

export async function createMigration() {
  const date = new Date()
    .toISOString()
    .substring(0, 19)
    .replace('T', '_')
    .replaceAll(':', '');

  const template = await fs.readFile(path.join(__dirname, 'template.ts'), {
    encoding: 'utf-8',
  });

  await fs.writeFile(
    path.join(__dirname, '../../migration', `${date}.ts`),
    template
  );
}

createMigration();
