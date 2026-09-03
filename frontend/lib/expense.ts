export const EXPENSE_CATEGORIES = [
  'Cooked Meals',
  'Non-Cooked Meals',
  'Non-Food',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_SORT_OPTIONS = [
  'newest',
  'oldest',
  'highest',
  'lowest',
] as const;

export type ExpenseSort = (typeof EXPENSE_SORT_OPTIONS)[number];

export interface Expense {
  id: number;
  merchant: string;
  amount: string;
  category: string;
  date: string;
  paymentMethod: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  merchant: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentMethod?: string;
  description?: string;
}

export type UpdateExpenseInput = Partial<ExpenseInput>;

export interface ExpenseFilters {
  category?: ExpenseCategory;
  startDate?: string;
  endDateExclusive?: string;
  sort?: ExpenseSort;
  timezoneOffset?: number;
}

export interface CategorySummary {
  category: ExpenseCategory;
  totalSpending: string;
  percentage: string;
}

export interface MonthlySummary {
  month: string;
  totalSpending: string;
  expenseCount: number;
}

export interface ExpenseSummary {
  totalSpending: string;
  expenseCount: number;
  averageExpense: string;
  byCategory: CategorySummary[];
  byMonth: MonthlySummary[];
}
