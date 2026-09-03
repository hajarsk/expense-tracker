import type {
  Expense,
  ExpenseFilters,
  ExpenseInput,
  ExpenseSummary,
  UpdateExpenseInput,
} from '@/lib/expense';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');

interface ApiErrorResponse {
  message?: string | string[];
}

function buildQueryString(filters: ExpenseFilters = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(error?.message)
      ? error.message.join(', ')
      : error?.message;

    throw new Error(message ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
  return request<Expense[]>(`/expenses${buildQueryString(filters)}`);
}

export function getExpenseSummary(
  filters?: ExpenseFilters,
): Promise<ExpenseSummary> {
  return request<ExpenseSummary>(
    `/expenses/summary${buildQueryString(filters)}`,
  );
}

export function createExpense(expense: ExpenseInput): Promise<Expense> {
  return request<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

export function updateExpense(
  id: number,
  expense: UpdateExpenseInput,
): Promise<Expense> {
  return request<Expense>(`/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(expense),
  });
}

export function deleteExpense(id: number): Promise<Expense> {
  return request<Expense>(`/expenses/${id}`, {
    method: 'DELETE',
  });
}
