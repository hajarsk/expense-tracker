import {
  assertConnectedIdentity,
  assertConnectionTarget,
  type ConnectedDatabaseIdentity,
  type DemoDatabaseTarget,
} from '../../prisma/demo-db-guard';

const target: DemoDatabaseTarget = {
  databaseName: 'expense_tracker_demo',
  hostname: 'demo.example.neon.tech',
  roleName: 'expense_demo_reset',
};

const resetIdentity: ConnectedDatabaseIdentity = {
  databaseName: 'expense_tracker_demo',
  roleName: 'expense_demo_reset',
  isSuperuser: false,
  canCreateDatabase: false,
  canCreateRole: false,
  canCreateSchema: false,
  canUseSchema: true,
  ownsExpenseTable: false,
  isMemberOfOtherRoles: false,
  canSelectExpense: true,
  canInsertExpense: true,
  canUpdateExpense: true,
  canDeleteExpense: true,
  canUseExpenseSequence: true,
};

describe('demo database guards', () => {
  it('requires an exact PostgreSQL host, database, role, and TLS mode', () => {
    expect(() =>
      assertConnectionTarget(
        'postgresql://expense_demo_reset@demo.example.neon.tech/expense_tracker_demo?sslmode=require',
        target,
      ),
    ).not.toThrow();
    expect(() =>
      assertConnectionTarget(
        'postgresql://expense_demo_reset@other.example.neon.tech/expense_tracker_demo?sslmode=require',
        target,
      ),
    ).toThrow('approved demo target');
  });

  it('requires a non-privileged reset role with only the operations reset needs', () => {
    expect(() =>
      assertConnectedIdentity(resetIdentity, target, true),
    ).not.toThrow();
    expect(() =>
      assertConnectedIdentity(
        { ...resetIdentity, canCreateSchema: true },
        target,
        true,
      ),
    ).toThrow('approved demo target');
    expect(() =>
      assertConnectedIdentity(
        { ...resetIdentity, isSuperuser: true },
        target,
        true,
      ),
    ).toThrow('approved demo target');
  });
});
