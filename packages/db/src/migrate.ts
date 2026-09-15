import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDb } from './client';

/** Applies every migration in `migrationsFolder` that has not run yet. */
export async function runMigrations(url: string, migrationsFolder: string): Promise<void> {
  const { db, sql } = createDb(url);
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await sql.end();
  }
}
