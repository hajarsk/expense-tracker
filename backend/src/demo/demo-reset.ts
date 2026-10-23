import type { Prisma } from '../../generated/prisma/client';
import { DEMO_EXPENSES } from './demo-expenses';
import { acquireDemoAdvisoryLock } from './demo-lock';

export async function resetDemoData(
  transaction: Prisma.TransactionClient,
): Promise<number> {
  await acquireDemoAdvisoryLock(transaction);
  const removed = await transaction.expense.deleteMany({
    where: { origin: 'VISITOR' },
  });

  for (const expense of DEMO_EXPENSES) {
    const { demoKey, ...fields } = expense;
    await transaction.expense.upsert({
      where: { demoKey },
      create: { ...fields, demoKey, origin: 'DEMO' },
      update: { ...fields, origin: 'DEMO' },
    });
  }
  return removed.count;
}
