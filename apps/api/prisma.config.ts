import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { defineConfig, env } from 'prisma/config';

try {
  loadEnvFile(path.join(import.meta.dirname, '.env.local'));
} catch {
  // Ignore if the file doesn't exist
}

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
  },
  schema: 'prisma/schema.prisma',
});
