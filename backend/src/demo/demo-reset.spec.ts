import { resetDemoData } from './demo-reset';
import { DEMO_EXPENSES } from './demo-expenses';

const transaction = {
  $queryRaw: jest.fn().mockResolvedValue([]),
  expense: {
    deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
    upsert: jest.fn().mockResolvedValue({}),
  },
};

describe('resetDemoData', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes only visitor records and restores all canonical samples by stable key', async () => {
    const removed = await resetDemoData(transaction as never);

    expect(transaction.$queryRaw).toHaveBeenCalled();
    expect(transaction.expense.deleteMany).toHaveBeenCalledWith({
      where: { origin: 'VISITOR' },
    });
    expect(transaction.expense.upsert).toHaveBeenCalledTimes(7);
    const upsertCalls = transaction.expense.upsert.mock
      .calls as unknown as Array<
      [
        {
          where: { demoKey: string };
          create: { demoKey: string; origin: string };
          update: { origin: string };
        },
      ]
    >;
    for (const expense of DEMO_EXPENSES) {
      const call = upsertCalls.find(
        ([arguments_]) => arguments_.where.demoKey === expense.demoKey,
      );
      expect(call?.[0].create.demoKey).toBe(expense.demoKey);
      expect(call?.[0].create.origin).toBe('DEMO');
      expect(call?.[0].update.origin).toBe('DEMO');
    }
    expect(removed).toBe(3);
  });
});
