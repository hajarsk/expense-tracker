export const EXPENSE_CATEGORIES = [
  'Cooked Meals',
  'Non-Cooked Meals',
  'Non-Food',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

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
