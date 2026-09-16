// Consumed by `pnpm db:generate`, which runs a pinned drizzle-kit through
// `pnpm dlx`. drizzle-kit is a CLI-only tool and deliberately not a workspace
// dependency, so nothing here imports from it.
export default {
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://ubuntu:postgres@localhost:5432/internal_tools',
  },
};
