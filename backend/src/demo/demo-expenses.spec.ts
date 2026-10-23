import { DEMO_EXPENSES } from './demo-expenses';

const approvedMerchants = [
  'Sample Kitchen Alpha',
  'Sample Market Birch',
  'Sample Transit Orbit',
  'Sample Café Lantern',
  'Sample Pantry Clover',
  'Sample Home Goods Kite',
  'Sample Diner Willow',
];

describe('canonical demo expenses', () => {
  it('contains seven fictional samples with stable unique keys', () => {
    expect(DEMO_EXPENSES).toHaveLength(7);
    expect(DEMO_EXPENSES.map(({ merchant }) => merchant)).toEqual(
      approvedMerchants,
    );
    expect(new Set(DEMO_EXPENSES.map(({ demoKey }) => demoKey)).size).toBe(7);
  });

  it('retains the supported expense fields and serializable dates', () => {
    for (const expense of DEMO_EXPENSES) {
      expect(expense.date.toISOString()).toMatch(
        /^2026-\d{2}-\d{2}T12:00:00\.000Z$/,
      );
      expect(expense.amount).toMatch(/^\d+\.\d{2}$/);
      expect(expense).toHaveProperty('category');
      expect(expense).toHaveProperty('paymentMethod');
      expect(expense).toHaveProperty('description');
    }
  });
});
