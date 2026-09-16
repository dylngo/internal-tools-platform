import { defineConfig } from 'vitest/config';

// Tests run against a throwaway database (TEST_DATABASE_URL) that the global
// setup drops and recreates on every run, so nothing touches dev data.
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://ubuntu:postgres@localhost:5432/internal_tools_test';
// Set here (not in `test.env`) so the global setup and the test workers both see it.
process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts'],
    globalSetup: ['./packages/db/test/global-setup.ts'],
    fileParallelism: false,
  },
});
