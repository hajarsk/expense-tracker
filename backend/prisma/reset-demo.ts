import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { DEMO_EXPENSES } from '../src/demo/demo-expenses';
import { resetDemoData } from '../src/demo/demo-reset';
import {
  assertConnectedIdentity,
  assertConnectionTarget,
  requireEnvironment,
  type ConnectedDatabaseIdentity,
  type DemoDatabaseTarget,
} from './demo-db-guard';

async function main() {
  const connectionString = requireEnvironment('DEMO_RESET_DATABASE_URL');
  const target: DemoDatabaseTarget = {
    databaseName: requireEnvironment('DEMO_DATABASE_NAME'),
    hostname: requireEnvironment('DEMO_DATABASE_HOST'),
    roleName: requireEnvironment('DEMO_RESET_ROLE'),
  };
  if (requireEnvironment('DEMO_RESET_CONFIRMATION') !== target.databaseName) {
    throw new Error(
      'Reset confirmation must exactly match the approved database name.',
    );
  }
  assertConnectionTarget(connectionString, target);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const identity = await transaction.$queryRaw<ConnectedDatabaseIdentity[]>`
        SELECT current_database() AS "databaseName",
               current_user AS "roleName",
               role.rolsuper AS "isSuperuser",
               role.rolcreatedb AS "canCreateDatabase",
               role.rolcreaterole AS "canCreateRole",
               (has_schema_privilege(current_user, 'public', 'CREATE') OR
                 has_database_privilege(current_user, current_database(), 'CREATE')) AS "canCreateSchema",
               has_schema_privilege(current_user, 'public', 'USAGE') AS "canUseSchema",
               EXISTS (
                 SELECT 1 FROM pg_catalog.pg_class AS relation
                 JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
                 WHERE relation.relname = 'Expense'
                   AND namespace.nspname = 'public'
                   AND relation.relowner = role.oid
               ) AS "ownsExpenseTable",
               EXISTS (
                 SELECT 1 FROM pg_catalog.pg_auth_members AS membership
                 WHERE membership.member = role.oid
               ) AS "isMemberOfOtherRoles",
               has_table_privilege(current_user, 'public."Expense"', 'SELECT') AS "canSelectExpense",
               has_table_privilege(current_user, 'public."Expense"', 'INSERT') AS "canInsertExpense",
               has_table_privilege(current_user, 'public."Expense"', 'UPDATE') AS "canUpdateExpense",
               has_table_privilege(current_user, 'public."Expense"', 'DELETE') AS "canDeleteExpense",
               has_sequence_privilege(current_user, pg_get_serial_sequence('public."Expense"', 'id'), 'USAGE') AS "canUseExpenseSequence"
        FROM pg_catalog.pg_roles AS role
        WHERE role.rolname = current_user
      `;
      if (identity.length !== 1) {
        throw new Error('Could not verify the connected PostgreSQL identity.');
      }
      assertConnectedIdentity(identity[0], target, true);
      return resetDemoData(transaction);
    });

    console.log(
      `Demo reset complete: removed ${result} visitor records and restored ${DEMO_EXPENSES.length} canonical records.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error(
    'Demo reset failed; sensitive connection details were omitted.',
  );
  process.exitCode = 1;
});
