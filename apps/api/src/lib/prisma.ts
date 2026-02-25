import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.ts';

declare global {
  // eslint-disable-next-line no-var -- Needed for Prisma singleton in development.
  var prismaClientSingleton: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined || databaseUrl.trim() === '') {
  throw new Error('Missing DATABASE_URL for Prisma Client initialization.');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});
const prisma =
  globalThis.prismaClientSingleton ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaClientSingleton = prisma;
}

export { prisma };
