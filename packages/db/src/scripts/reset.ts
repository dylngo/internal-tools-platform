import postgres from 'postgres';
import { requireDatabaseUrl } from '../client';
import { runMigrations } from '../migrate';
import { migrationsFolder } from './migrate';
import { runSeed } from './seed';

/**
 * Development only: drops every table in the public schema, then migrates and
 * seeds from scratch. This is the one sanctioned way to clear local data; the
 * application code has no delete path for audit rows.
 */
async function reset(url: string): Promise<void> {
  const sql = postgres(url, { max: 1 });
  try {
    await sql`DROP SCHEMA public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  } finally {
    await sql.end();
  }
  await runMigrations(url, migrationsFolder);
  await runSeed(url);
  console.log('database reset');
}

reset(requireDatabaseUrl()).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
