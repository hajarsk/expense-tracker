import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { DEMO_EXPENSES } from '../src/demo/demo-expenses';
import { acquireDemoAdvisoryLock } from '../src/demo/demo-lock';
import {
  assertConnectedIdentity,
  assertConnectionTarget,
  type ConnectedDatabaseIdentity,
  type DemoDatabaseTarget,
} from './demo-db-guard';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DIRECT_URL or DATABASE_URL is required to seed the database.',
  );
}

const productionTarget: DemoDatabaseTarget | undefined =
  process.env.NODE_ENV === 'production'
    ? {
        databaseName: process.env.DEMO_DATABASE_NAME ?? '',
        hostname: process.env.DEMO_DATABASE_HOST ?? '',
        roleName: process.env.DEMO_MIGRATION_ROLE ?? '',
      }
    : undefined;

if (productionTarget) {
  if (
    !productionTarget.databaseName ||
    !productionTarget.hostname ||
    !productionTarget.roleName
  ) {
    throw new Error('Production seed target configuration is incomplete.');
  }
  assertConnectionTarget(connectionString, productionTarget);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const result = await prisma.$transaction(async (transaction) => {
    if (productionTarget) {
      const identity = await transaction.$queryRaw<ConnectedDatabaseIdentity[]>`
        SELECT current_database() AS "databaseName",
               current_user AS "roleName",
               role.rolsuper AS "isSuperuser",
               role.rolcreatedb AS "canCreateDatabase",
               role.rolcreaterole AS "canCreateRole"
        FROM pg_catalog.pg_roles AS role
        WHERE role.rolname = current_user
      `;
      if (identity.length !== 1) {
        throw new Error('Could not verify the connected PostgreSQL identity.');
      }
      assertConnectedIdentity(identity[0], productionTarget, false);
    }
    await acquireDemoAdvisoryLock(transaction);

    const currentDemoCount = await transaction.expense.count({
      where: { origin: { in: ['DEMO', 'VISITOR'] } },
    });
    const existingCanonicalRows = await transaction.expense.findMany({
      where: { demoKey: { in: DEMO_EXPENSES.map(({ demoKey }) => demoKey) } },
      select: { demoKey: true, origin: true },
    });
    const existingKeys = new Set(
      existingCanonicalRows.flatMap(({ demoKey, origin }) =>
        demoKey && ['DEMO', 'VISITOR'].includes(origin) ? [demoKey] : [],
      ),
    );
    const missingCanonicalRows = DEMO_EXPENSES.filter(
      ({ demoKey }) => !existingKeys.has(demoKey),
    ).length;
    if (currentDemoCount + missingCanonicalRows > 500) {
      throw new Error(
        'Seed refused because canonical records would exceed the 500-record demo limit.',
      );
    }

    for (const expense of DEMO_EXPENSES) {
      const { demoKey, ...fields } = expense;
      await transaction.expense.upsert({
        where: { demoKey },
        create: { ...fields, demoKey, origin: 'DEMO' },
        update: { ...fields, origin: 'DEMO' },
      });
    }

    return DEMO_EXPENSES.length;
  });

  console.log(`Demo seed complete: upserted ${result} canonical records.`);
}

main()
  .catch(() => {
    console.error('Demo seed failed. No records were intentionally deleted.');
    console.error(
      'Seed error details were omitted to protect connection credentials.',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
