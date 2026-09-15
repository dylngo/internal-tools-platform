import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function createDb(url: string) {
  const sql = postgres(url, { max: 10 });
  return { db: drizzle(sql, { schema }), sql };
}

export type Database = ReturnType<typeof createDb>['db'];
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Anything that can run a query: the root database or an open transaction. */
export type DbExecutor = Database | Transaction;

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set (see .env at the repo root)');
  }
  return url;
}
