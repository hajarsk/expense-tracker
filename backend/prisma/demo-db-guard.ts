import { URL } from 'node:url';

export interface DemoDatabaseTarget {
  databaseName: string;
  hostname: string;
  roleName: string;
}

export interface ConnectedDatabaseIdentity {
  databaseName: string;
  roleName: string;
  isSuperuser: boolean;
  canCreateDatabase: boolean;
  canCreateRole: boolean;
  canCreateSchema?: boolean;
  canUseSchema?: boolean;
  ownsExpenseTable?: boolean;
  isMemberOfOtherRoles?: boolean;
  canSelectExpense?: boolean;
  canInsertExpense?: boolean;
  canUpdateExpense?: boolean;
  canDeleteExpense?: boolean;
  canUseExpenseSequence?: boolean;
}

export function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required configuration is missing: ${name}`);
  return value;
}

export function assertConnectionTarget(
  connectionString: string,
  target: DemoDatabaseTarget,
): void {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error('Database connection target is invalid.');
  }

  const protocolIsPostgres = ['postgres:', 'postgresql:'].includes(
    parsed.protocol,
  );
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  const roleName = decodeURIComponent(parsed.username);
  const sslMode = parsed.searchParams.get('sslmode');

  if (
    !protocolIsPostgres ||
    parsed.hostname.toLowerCase() !== target.hostname.toLowerCase() ||
    parsed.hostname.toLowerCase().includes('-pooler.') ||
    databaseName !== target.databaseName ||
    roleName !== target.roleName ||
    !['require', 'verify-ca', 'verify-full'].includes(sslMode ?? '')
  ) {
    throw new Error(
      'Database connection does not match the approved demo target.',
    );
  }
}

export function assertConnectedIdentity(
  identity: ConnectedDatabaseIdentity,
  target: DemoDatabaseTarget,
  requireLeastPrivilege: boolean,
): void {
  if (
    identity.databaseName !== target.databaseName ||
    identity.roleName !== target.roleName ||
    identity.isSuperuser ||
    (requireLeastPrivilege &&
      (identity.canCreateDatabase ||
        identity.canCreateRole ||
        identity.canCreateSchema !== false ||
        identity.canUseSchema !== true ||
        identity.ownsExpenseTable !== false ||
        identity.isMemberOfOtherRoles !== false ||
        identity.canSelectExpense !== true ||
        identity.canInsertExpense !== true ||
        identity.canUpdateExpense !== true ||
        identity.canDeleteExpense !== true ||
        identity.canUseExpenseSequence !== true))
  ) {
    throw new Error(
      'Connected PostgreSQL identity does not match the approved demo target.',
    );
  }
}
