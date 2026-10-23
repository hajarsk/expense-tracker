import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpensesService } from './expenses.service';
import { ExpenseSort } from './enums/expense-sort.enum';

const demoExpense = {
  id: 1,
  origin: 'DEMO',
  demoKey: 'sample-kitchen-alpha',
  merchant: 'Sample Kitchen Alpha',
  amount: '18.50',
  category: 'Cooked Meals',
  date: new Date('2026-09-02T12:00:00.000Z'),
  paymentMethod: 'E-wallet',
  description: '[Demo data] Lunch with teh ais',
  createdAt: new Date('2026-09-02T12:00:00.000Z'),
  updatedAt: new Date('2026-09-02T12:00:00.000Z'),
};

const expenseTransaction = {
  $queryRaw: jest.fn().mockResolvedValue([]),
  expense: {
    count: jest.fn().mockResolvedValue(7),
    create: jest
      .fn()
      .mockResolvedValue({ ...demoExpense, origin: 'VISITOR', demoKey: null }),
    findUnique: jest.fn().mockResolvedValue(demoExpense),
    update: jest.fn().mockResolvedValue(demoExpense),
    delete: jest.fn().mockResolvedValue(demoExpense),
  },
};

const prismaMock = {
  $transaction: jest.fn(
    (callback: (transaction: typeof expenseTransaction) => Promise<unknown>) =>
      callback(expenseTransaction),
  ),
  expense: {
    findMany: jest.fn().mockResolvedValue([demoExpense]),
    findUnique: jest.fn().mockResolvedValue(demoExpense),
  },
};

describe('ExpensesService', () => {
  let service: ExpensesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.expense.findMany.mockResolvedValue([demoExpense]);
    prismaMock.expense.findUnique.mockResolvedValue(demoExpense);
    expenseTransaction.expense.count.mockResolvedValue(7);
    expenseTransaction.expense.create.mockResolvedValue({
      ...demoExpense,
      origin: 'VISITOR',
      demoKey: null,
    });
    expenseTransaction.expense.findUnique.mockResolvedValue(demoExpense);
    expenseTransaction.expense.update.mockResolvedValue(demoExpense);
    expenseTransaction.expense.delete.mockResolvedValue(demoExpense);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('does not expose origin or demoKey from list, get, create, update, or delete', async () => {
    const input = {
      merchant: 'Visitor Sample',
      amount: 2,
      category: 'Non-Food',
      date: new Date('2026-09-02T12:00:00.000Z'),
    } as never;

    const list = await service.findAll({ sort: ExpenseSort.NEWEST } as never);
    const one = await service.findOne(1);
    const created = await service.create(input);
    const updated = await service.update(1, input);
    const deleted = await service.remove(1);
    prismaMock.expense.findMany.mockResolvedValueOnce([]);
    const summary = await service.getSummary({ timezoneOffset: 0 } as never);

    for (const result of [list[0], one, created, updated, deleted]) {
      expect(result).not.toHaveProperty('origin');
      expect(result).not.toHaveProperty('demoKey');
    }
    expect(JSON.stringify(summary)).not.toMatch(/"origin"|"demoKey"/);
  });

  it('marks visitor-created expenses and caps demo plus visitor rows atomically', async () => {
    await service.create({
      merchant: 'Visitor Sample',
      amount: 2,
      category: 'Non-Food',
      date: new Date('2026-09-02T12:00:00.000Z'),
    } as never);

    expect(expenseTransaction.expense.count).toHaveBeenCalledWith({
      where: { origin: { in: ['DEMO', 'VISITOR'] } },
    });
    const createCalls = expenseTransaction.expense.create.mock
      .calls as unknown as Array<[{ data: { origin: string } }]>;
    const createArguments = createCalls[0]?.[0];
    expect(createArguments.data.origin).toBe('VISITOR');

    expenseTransaction.expense.count.mockResolvedValueOnce(500);
    await expect(
      service.create({
        merchant: 'Visitor Sample',
        amount: 2,
        category: 'Non-Food',
        date: new Date('2026-09-02T12:00:00.000Z'),
      } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
