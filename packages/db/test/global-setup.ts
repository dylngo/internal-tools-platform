import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { runMigrations } from '../src/migrate';

// Recreates the test database from scratch before every test run. DATABASE_URL
// is pointed at the test database by vitest.config.ts.
export default async function setup(): Promise<void> {
  const url = new URL(process.env.DATABASE_URL ?? '');
  const dbName = url.pathname.slice(1);
  if (!dbName.endsWith('_test')) {
    throw new Error(`refusing to drop "${dbName}": test database name must end in _test`);
  }

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const sql = postgres(adminUrl.toString(), { max: 1, onnotice: () => {} });
  try {
    await sql.unsafe(`DROP DATABASE IF EXISTS "${dbName}"`);
    await sql.unsafe(`CREATE DATABASE "${dbName}"`);
  } finally {
    await sql.end();
  }

  const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url));
  await runMigrations(url.toString(), migrationsFolder);
}
