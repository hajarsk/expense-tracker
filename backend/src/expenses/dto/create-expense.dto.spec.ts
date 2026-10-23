import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExpenseDto } from './create-expense.dto';

const validExpense = {
  merchant: 'Sample Market Birch',
  amount: 1.25,
  category: 'Non-Food',
  date: '2026-09-02T12:00:00.000Z',
};

describe('CreateExpenseDto public demo validation', () => {
  it.each([
    ['merchant', 'm'.repeat(81)],
    ['paymentMethod', 'p'.repeat(41)],
    ['description', 'd'.repeat(241)],
  ])('rejects an overlong %s', async (field, value) => {
    const dto = plainToInstance(CreateExpenseDto, {
      ...validExpense,
      [field]: value,
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === field)).toBe(true);
  });

  it('rejects internal provenance fields from public input', async () => {
    const dto = plainToInstance(CreateExpenseDto, {
      ...validExpense,
      origin: 'DEMO',
      demoKey: 'sample-kitchen-alpha',
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.some((error) => error.property === 'origin')).toBe(true);
    expect(errors.some((error) => error.property === 'demoKey')).toBe(true);
  });
});
