import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { env } from '../env';
import type { DB } from './generated';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
});

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool,
  }),
  // log: ['query', 'error'],
});
