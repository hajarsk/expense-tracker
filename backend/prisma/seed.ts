import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const DEMO_MARKER = '[Demo data]';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const demoExpenses = [
  {
    merchant: 'Nasi Kandar Pelita',
    amount: '18.50',
    category: 'Cooked Meals',
    date: new Date('2026-09-02T12:00:00.000Z'),
    paymentMethod: 'E-wallet',
    description: `${DEMO_MARKER} Lunch with teh ais`,
  },
  {
    merchant: 'Village Grocer',
    amount: '86.40',
    category: 'Non-Cooked Meals',
    date: new Date('2026-08-27T12:00:00.000Z'),
    paymentMethod: 'Card',
    description: `${DEMO_MARKER} Weekly groceries`,
  },
  {
    merchant: 'Rapid KL',
    amount: '50.00',
    category: 'Non-Food',
    date: new Date('2026-08-18T12:00:00.000Z'),
    paymentMethod: 'E-wallet',
    description: `${DEMO_MARKER} Transit card reload`,
  },
  {
    merchant: 'OldTown White Coffee',
    amount: '24.90',
    category: 'Cooked Meals',
    date: new Date('2026-07-21T12:00:00.000Z'),
    paymentMethod: 'Cash',
    description: `${DEMO_MARKER} Breakfast`,
  },
  {
    merchant: 'Jaya Grocer',
    amount: '112.35',
    category: 'Non-Cooked Meals',
    date: new Date('2026-07-09T12:00:00.000Z'),
    paymentMethod: 'Card',
    description: `${DEMO_MARKER} Pantry and fresh produce`,
  },
  {
    merchant: 'MR.DIY',
    amount: '37.80',
    category: 'Non-Food',
    date: new Date('2026-06-14T12:00:00.000Z'),
    paymentMethod: 'Card',
    description: `${DEMO_MARKER} Household supplies`,
  },
  {
    merchant: 'Restoran Rebung',
    amount: '42.00',
    category: 'Cooked Meals',
    date: new Date('2026-06-05T12:00:00.000Z'),
    paymentMethod: 'E-wallet',
    description: `${DEMO_MARKER} Dinner`,
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed the database.');
  }

  const result = await prisma.$transaction(async (transaction) => {
    const removed = await transaction.expense.deleteMany({
      where: { description: { startsWith: DEMO_MARKER } },
    });
    const inserted = await transaction.expense.createMany({
      data: demoExpenses,
    });

    return { removed: removed.count, inserted: inserted.count };
  });

  console.log(
    `Demo seed complete: replaced ${result.removed} demo records with ${result.inserted} records.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
