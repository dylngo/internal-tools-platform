import path from 'node:path';
import { requireDatabaseUrl } from '../client';
import { runMigrations } from '../migrate';

export const migrationsFolder = path.join(__dirname, '..', '..', 'migrations');

if (require.main === module) {
  runMigrations(requireDatabaseUrl(), migrationsFolder).then(
    () => console.log('migrations applied'),
    (error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
