import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpenseCategory } from './enums/expense-category.enum';
import { ExpenseSort } from './enums/expense-sort.enum';
import { acquireDemoAdvisoryLock } from '../demo/demo-lock';

const MAX_DEMO_EXPENSES = 500;

function toPublicExpense<T extends { origin: string; demoKey: string | null }>(
  expense: T,
) {
  const { origin, demoKey, ...publicFields } = expense;
  void origin;
  void demoKey;
  return publicFields;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto) {
    return this.prisma.$transaction(async (transaction) => {
      await acquireDemoAdvisoryLock(transaction);

      const count = await transaction.expense.count({
        where: { origin: { in: ['DEMO', 'VISITOR'] } },
      });
      if (count >= MAX_DEMO_EXPENSES) {
        throw new ConflictException(
          'The shared demo has reached its 500 expense limit. Delete an expense or restore the demo later.',
        );
      }

      const expense = await transaction.expense.create({
        data: {
          ...createExpenseDto,
          origin: 'VISITOR',
        },
      });
      return toPublicExpense(expense);
    });
  }

  async findAll(query: ExpenseQueryDto) {
    const expenses = await this.prisma.expense.findMany({
      where: this.buildWhere(query),
      orderBy: this.buildOrderBy(query.sort),
    });
    return expenses.map(toPublicExpense);
  }

  async getSummary(query: ExpenseQueryDto) {
    const expenses = await this.prisma.expense.findMany({
      where: this.buildWhere(query),
      select: {
        amount: true,
        category: true,
        date: true,
      },
    });

    const categoryTotals = new Map<ExpenseCategory, Prisma.Decimal>(
      Object.values(ExpenseCategory).map((category) => [
        category,
        new Prisma.Decimal(0),
      ]),
    );
    const monthlyTotals = new Map<
      string,
      { total: Prisma.Decimal; count: number }
    >();
    let total = new Prisma.Decimal(0);

    for (const expense of expenses) {
      total = total.plus(expense.amount);

      if (
        Object.values(ExpenseCategory).includes(
          expense.category as ExpenseCategory,
        )
      ) {
        const category = expense.category as ExpenseCategory;
        categoryTotals.set(
          category,
          categoryTotals.get(category)!.plus(expense.amount),
        );
      }

      const localDate = new Date(
        expense.date.getTime() - query.timezoneOffset * 60_000,
      );
      const month = `${localDate.getUTCFullYear()}-${String(
        localDate.getUTCMonth() + 1,
      ).padStart(2, '0')}`;
      const existingMonth = monthlyTotals.get(month) ?? {
        total: new Prisma.Decimal(0),
        count: 0,
      };

      monthlyTotals.set(month, {
        total: existingMonth.total.plus(expense.amount),
        count: existingMonth.count + 1,
      });
    }

    return {
      totalSpending: total.toFixed(2),
      expenseCount: expenses.length,
      averageExpense:
        expenses.length === 0 ? '0.00' : total.div(expenses.length).toFixed(2),
      byCategory: Object.values(ExpenseCategory).map((category) => {
        const categoryTotal = categoryTotals.get(category)!;

        return {
          category,
          totalSpending: categoryTotal.toFixed(2),
          percentage: total.isZero()
            ? '0.0'
            : categoryTotal.div(total).mul(100).toFixed(1),
        };
      }),
      byMonth: Array.from(monthlyTotals.entries())
        .sort(([firstMonth], [secondMonth]) =>
          secondMonth.localeCompare(firstMonth),
        )
        .map(([month, summary]) => ({
          month,
          totalSpending: summary.total.toFixed(2),
          expenseCount: summary.count,
        })),
    };
  }

  async findOne(id: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return toPublicExpense(expense);
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto) {
    return this.prisma.$transaction(async (transaction) => {
      await acquireDemoAdvisoryLock(transaction);

      const existingExpense = await transaction.expense.findUnique({
        where: { id },
      });
      if (!existingExpense) {
        throw new NotFoundException(`Expense with ID ${id} not found`);
      }

      const expense = await transaction.expense.update({
        where: { id },
        data: { ...updateExpenseDto },
      });
      return toPublicExpense(expense);
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (transaction) => {
      await acquireDemoAdvisoryLock(transaction);

      const existingExpense = await transaction.expense.findUnique({
        where: { id },
      });
      if (!existingExpense) {
        throw new NotFoundException(`Expense with ID ${id} not found`);
      }

      const expense = await transaction.expense.delete({ where: { id } });
      return toPublicExpense(expense);
    });
  }

  private buildWhere(query: ExpenseQueryDto): Prisma.ExpenseWhereInput {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDateExclusive = query.endDateExclusive
      ? new Date(query.endDateExclusive)
      : undefined;

    if (startDate && endDateExclusive && startDate >= endDateExclusive) {
      throw new BadRequestException(
        'startDate must be before endDateExclusive',
      );
    }

    return {
      category: query.category,
      date:
        startDate || endDateExclusive
          ? {
              gte: startDate,
              lt: endDateExclusive,
            }
          : undefined,
    };
  }

  private buildOrderBy(
    sort: ExpenseSort,
  ): Prisma.ExpenseOrderByWithRelationInput[] {
    switch (sort) {
      case ExpenseSort.OLDEST:
        return [{ date: 'asc' }, { id: 'asc' }];
      case ExpenseSort.HIGHEST:
        return [{ amount: 'desc' }, { date: 'desc' }, { id: 'desc' }];
      case ExpenseSort.LOWEST:
        return [{ amount: 'asc' }, { date: 'desc' }, { id: 'desc' }];
      case ExpenseSort.NEWEST:
      default:
        return [{ date: 'desc' }, { id: 'desc' }];
    }
  }
}
