import { createDb, type Database, requireDatabaseUrl } from './client';

// Next.js re-evaluates modules on hot reload in development; keep one pool per
// process instead of opening a new one on every edit.
const globalForDb = globalThis as { __platformDb?: ReturnType<typeof createDb> };
globalForDb.__platformDb ??= createDb(requireDatabaseUrl());

/** The application database (DATABASE_URL). postgres.js connects on first query. */
export const db: Database = globalForDb.__platformDb.db;
