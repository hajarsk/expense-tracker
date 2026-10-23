import 'dotenv/config';
import { Client } from 'pg';
import {
  assertConnectedIdentity,
  assertConnectionTarget,
  requireEnvironment,
  type DemoDatabaseTarget,
} from './demo-db-guard';

async function main() {
  const connectionString = requireEnvironment('DIRECT_URL');
  const target: DemoDatabaseTarget = {
    databaseName: requireEnvironment('DEMO_DATABASE_NAME'),
    hostname: requireEnvironment('DEMO_DATABASE_HOST'),
    roleName: requireEnvironment('DEMO_MIGRATION_ROLE'),
  };
  assertConnectionTarget(connectionString, target);

  const client = new Client({ connectionString });
  let connected = false;
  try {
    await client.connect();
    connected = true;
    const identityResult = await client.query<{
      databaseName: string;
      roleName: string;
      isSuperuser: boolean;
      canCreateDatabase: boolean;
      canCreateRole: boolean;
      canCreateSchema: boolean;
      canUseSchema: boolean;
    }>(`
      SELECT current_database() AS "databaseName",
             current_user AS "roleName",
             role.rolsuper AS "isSuperuser",
             role.rolcreatedb AS "canCreateDatabase",
             role.rolcreaterole AS "canCreateRole",
             has_schema_privilege(current_user, 'public', 'CREATE') AS "canCreateSchema",
             has_schema_privilege(current_user, 'public', 'USAGE') AS "canUseSchema"
      FROM pg_catalog.pg_roles AS role
      WHERE role.rolname = current_user
    `);
    if (identityResult.rows.length !== 1) {
      throw new Error('Could not verify the connected PostgreSQL identity.');
    }
    const identity = identityResult.rows[0];
    assertConnectedIdentity(identity, target, false);
    if (
      identity.canCreateDatabase ||
      identity.canCreateRole ||
      !identity.canCreateSchema ||
      !identity.canUseSchema
    ) {
      throw new Error('Migration role lacks the required scoped permissions.');
    }

    if (process.argv.includes('--require-empty')) {
      const existingObject = await client.query<{ exists: boolean }>(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_catalog.pg_class AS relation
          JOIN pg_catalog.pg_namespace AS namespace
            ON namespace.oid = relation.relnamespace
          WHERE namespace.nspname NOT IN ('pg_catalog', 'information_schema')
            AND namespace.nspname NOT LIKE 'pg_toast%'
            AND relation.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
        ) OR EXISTS (
          SELECT 1
          FROM pg_catalog.pg_type AS type
          JOIN pg_catalog.pg_namespace AS namespace
            ON namespace.oid = type.typnamespace
          WHERE namespace.nspname NOT IN ('pg_catalog', 'information_schema')
            AND namespace.nspname NOT LIKE 'pg_toast%'
            AND type.typtype IN ('c', 'e', 'd', 'r')
        ) OR EXISTS (
          SELECT 1
          FROM pg_catalog.pg_namespace AS namespace
          WHERE namespace.nspname NOT IN ('pg_catalog', 'information_schema', 'public')
            AND namespace.nspname NOT LIKE 'pg_toast%'
        ) OR EXISTS (
          SELECT 1
          FROM pg_catalog.pg_proc AS routine
          JOIN pg_catalog.pg_namespace AS namespace
            ON namespace.oid = routine.pronamespace
          WHERE namespace.nspname NOT IN ('pg_catalog', 'information_schema')
            AND namespace.nspname NOT LIKE 'pg_toast%'
        ) AS exists
      `);
      if (existingObject.rows[0]?.exists) {
        throw new Error(
          'Bootstrap refused: the target database is not empty. No cleanup was attempted.',
        );
      }
    }

    console.log(
      process.argv.includes('--require-empty')
        ? 'Demo database identity verified and target is empty.'
        : 'Demo database identity verified.',
    );
  } finally {
    if (connected) await client.end();
  }
}

main().catch(() => {
  console.error(
    'Database preflight failed; no migration or cleanup was attempted. Details were omitted.',
  );
  process.exitCode = 1;
});
