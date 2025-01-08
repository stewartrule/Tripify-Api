import { Kysely } from 'kysely';
import type { DB } from './generated';

export async function pivot(
  db: Kysely<any>,
  // leftTable: string,
  // rightTable: string
  leftTable: keyof DB,
  rightTable: keyof DB
) {
  await db.schema
    .createTable(`${leftTable}_${rightTable}`)
    .addColumn(`id`, `serial`, (col) => col.primaryKey())
    .addColumn(`${leftTable}_id`, `integer`, (col) =>
      col.references(`${leftTable}.id`).onDelete(`cascade`).notNull()
    )
    .addColumn(`${rightTable}_id`, `integer`, (col) =>
      col.references(`${rightTable}.id`).onDelete(`cascade`).notNull()
    )
    .execute();

  await db.schema
    .createIndex(`${leftTable}_${rightTable}_unique`)
    .on(`${leftTable}_${rightTable}`)
    .columns([`${leftTable}_id`, `${rightTable}_id`])
    .unique()
    .execute();
}
