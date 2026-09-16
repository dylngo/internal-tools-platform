import { createDb, requireDatabaseUrl } from '../client';
import { seed } from '../seed';

export async function runSeed(url: string): Promise<void> {
  const { db, sql } = createDb(url);
  try {
    const inserted = await seed(db);
    console.log(
      `seeded ${inserted.users} users, ${inserted.customers} customers, ${inserted.featureFlags} feature flags`,
    );
  } finally {
    await sql.end();
  }
}

if (require.main === module) {
  runSeed(requireDatabaseUrl()).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
