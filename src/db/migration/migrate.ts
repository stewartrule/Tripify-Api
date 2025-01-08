import { promises as fs } from 'fs';
import { FileMigrationProvider, MigrationResult, Migrator } from 'kysely';
import * as path from 'path';
import { db } from '../index';

export const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, '../../migration'),
  }),
});

export async function migrateDown() {
  const { error, results = [] } = await migrator.migrateDown();

  logResults(results);

  if (error) {
    console.error('failed to migrate down');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

export async function migrateToLatest() {
  const { error, results = [] } = await migrator.migrateToLatest();

  logResults(results);

  if (error) {
    console.error('failed to migrate to latest');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

function logResults(results: MigrationResult[]) {
  results.forEach((it) => {
    if (it.status === 'Success') {
      console.log(
        `migration "${it.migrationName}" successfully migrated ${it.direction}`
      );
    } else if (it.status === 'Error') {
      console.error(`failed to migrate ${it.direction} "${it.migrationName}"`);
    }
  });
}
