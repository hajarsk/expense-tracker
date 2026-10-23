import { ExpenseCategory } from '../expenses/enums/expense-category.enum';

export interface DemoExpense {
  demoKey: string;
  merchant: string;
  amount: string;
  category: ExpenseCategory;
  date: Date;
  paymentMethod: string;
  description: string;
}

export const DEMO_EXPENSES: readonly DemoExpense[] = [
  {
    demoKey: 'sample-kitchen-alpha',
    merchant: 'Sample Kitchen Alpha',
    amount: '18.50',
    category: ExpenseCategory.COOKED_MEALS,
    date: new Date('2026-09-02T12:00:00.000Z'),
    paymentMethod: 'E-wallet',
    description: '[Demo data] Lunch with teh ais',
  },
  {
    demoKey: 'sample-market-birch',
    merchant: 'Sample Market Birch',
    amount: '86.40',
    category: ExpenseCategory.NON_COOKED_MEALS,
    date: new Date('2026-08-27T12:00:00.000Z'),
    paymentMethod: 'Card',
    description: '[Demo data] Weekly groceries',
  },
  {
    demoKey: 'sample-transit-orbit',
    merchant: 'Sample Transit Orbit',
    amount: '50.00',
    category: ExpenseCategory.NON_FOOD,
    date: new Date('2026-08-18T12:00:00.000Z'),
    paymentMethod: 'E-wallet',
    description: '[Demo data] Transit card reload',
  },
  {
    demoKey: 'sample-cafe-lantern',
    merchant: 'Sample Café Lantern',
    amount: '24.90',
    category: ExpenseCategory.COOKED_MEALS,
    date: new Date('2026-07-21T12:00:00.000Z'),
    paymentMethod: 'Cash',
    description: '[Demo data] Breakfast',
  },
  {
    demoKey: 'sample-pantry-clover',
    merchant: 'Sample Pantry Clover',
    amount: '112.35',
    category: ExpenseCategory.NON_COOKED_MEALS,
    date: new Date('2026-07-09T12:00:00.000Z'),
    paymentMethod: 'Card',
    description: '[Demo data] Pantry and fresh produce',
  },
  {
    demoKey: 'sample-home-goods-kite',
    merchant: 'Sample Home Goods Kite',
    amount: '37.80',
    category: ExpenseCategory.NON_FOOD,
    date: new Date('2026-06-14T12:00:00.000Z'),
    paymentMethod: 'Card',
    description: '[Demo data] Household supplies',
  },
  {
    demoKey: 'sample-diner-willow',
    merchant: 'Sample Diner Willow',
    amount: '42.00',
    category: ExpenseCategory.COOKED_MEALS,
    date: new Date('2026-06-05T12:00:00.000Z'),
    paymentMethod: 'E-wallet',
    description: '[Demo data] Dinner',
  },
];
