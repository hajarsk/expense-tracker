'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from '@/lib/expenses-api';
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
} from '@/lib/expense';

interface ExpenseFormState {
  merchant: string;
  amount: string;
  category: string;
  date: string;
  paymentMethod: string;
  description: string;
}

function getEmptyForm(): ExpenseFormState {
  return {
    merchant: '',
    amount: '',
    category: '',
    date: getLocalDateInputValue(new Date()),
    paymentMethod: '',
    description: '',
  };
}

function getLocalDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isExpenseCategory(category: string): category is ExpenseCategory {
  return EXPENSE_CATEGORIES.some((option) => option === category);
}

const fieldClassName =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10';

function formatAmount(amount: string) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(Number(amount));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState<ExpenseFormState>(getEmptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const today = getLocalDateInputValue(new Date());

  async function loadExpenses() {
    setIsLoading(true);
    setError(null);

    try {
      setExpenses(await getExpenses());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    getExpenses()
      .then((loadedExpenses) => {
        if (!ignore) setExpenses(loadedExpenses);
      })
      .catch((loadError: unknown) => {
        if (!ignore) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  function updateForm(field: keyof ExpenseFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(getEmptyForm());
    setEditingId(null);
  }

  function startEditing(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      merchant: expense.merchant,
      amount: expense.amount,
      category: isExpenseCategory(expense.category) ? expense.category : '',
      date: getLocalDateInputValue(new Date(expense.date)),
      paymentMethod: expense.paymentMethod ?? '',
      description: expense.description ?? '',
    });
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload: ExpenseInput = {
      merchant: form.merchant.trim(),
      amount: Number(form.amount),
      category: form.category as ExpenseCategory,
      date: new Date(`${form.date}T00:00:00`).toISOString(),
      ...(form.paymentMethod.trim() && {
        paymentMethod: form.paymentMethod.trim(),
      }),
      ...(form.description.trim() && {
        description: form.description.trim(),
      }),
    };

    try {
      if (editingId !== null) {
        const updated = await updateExpense(editingId, payload);
        setExpenses((current) =>
          current.map((expense) =>
            expense.id === updated.id ? updated : expense,
          ),
        );
        setSuccess('Expense updated successfully.');
      } else {
        const created = await createExpense(payload);
        setExpenses((current) => [created, ...current]);
        setSuccess('Expense added successfully.');
      }

      resetForm();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(
      `Delete the expense from ${expense.merchant}? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(expense.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteExpense(expense.id);
      setExpenses((current) =>
        current.filter((item) => item.id !== expense.id),
      );
      if (editingId === expense.id) resetForm();
      setSuccess('Expense deleted successfully.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Personal finance
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Expense Tracker
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Record daily spending and keep every expense in one clear place.
            </p>
          </div>
          <div className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
          </div>
        </header>

        {(error || success) && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
            role={error ? 'alert' : 'status'}
          >
            {error ?? success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">
                  {editingId === null ? 'Add expense' : 'Edit expense'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId === null
                    ? 'Enter the details of your purchase.'
                    : 'Update the selected expense.'}
                </p>
              </div>
              {editingId !== null && (
                <button
                  className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel
                </button>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-700">
                Merchant
                <input
                  className={fieldClassName}
                  onChange={(event) => updateForm('merchant', event.target.value)}
                  placeholder="e.g. Village Grocer"
                  required
                  type="text"
                  value={form.merchant}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Amount (MYR)
                  <input
                    className={fieldClassName}
                    max="99999999.99"
                    min="0.01"
                    onChange={(event) => updateForm('amount', event.target.value)}
                    placeholder="0.00"
                    required
                    step="0.01"
                    type="number"
                    value={form.amount}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Date
                  <input
                    className={fieldClassName}
                    max={today}
                    onChange={(event) => updateForm('date', event.target.value)}
                    required
                    type="date"
                    value={form.date}
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Category
                <select
                  className={fieldClassName}
                  onChange={(event) => updateForm('category', event.target.value)}
                  required
                  value={form.category}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Payment method
                <select
                  className={fieldClassName}
                  onChange={(event) =>
                    updateForm('paymentMethod', event.target.value)
                  }
                  value={form.paymentMethod}
                >
                  <option value="">Not specified</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="E-wallet">E-wallet</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Description <span className="font-normal text-slate-400">(optional)</span>
                <textarea
                  className={`${fieldClassName} min-h-24 resize-y`}
                  onChange={(event) =>
                    updateForm('description', event.target.value)
                  }
                  placeholder="Add a short note"
                  value={form.description}
                />
              </label>

              <button
                className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? 'Saving…'
                  : editingId === null
                    ? 'Add expense'
                    : 'Save changes'}
              </button>
            </form>
          </section>

          <section aria-labelledby="expense-list-heading">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold" id="expense-list-heading">
                  Recent expenses
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your saved expenses appear here.
                </p>
              </div>
              {!isLoading && error && (
                <button
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => void loadExpenses()}
                  type="button"
                >
                  Try again
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3" aria-label="Loading expenses">
                {[1, 2, 3].map((item) => (
                  <div
                    className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
                    key={item}
                  />
                ))}
              </div>
            ) : error && expenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-6 py-12 text-center">
                <h3 className="font-bold text-red-900">Expenses could not be loaded</h3>
                <p className="mt-2 text-sm text-red-700">
                  Check that the API is running, then try again.
                </p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-700">
                  +
                </div>
                <h3 className="font-bold text-slate-900">No expenses yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Add your first expense using the form to start building your record.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <article
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 sm:p-6"
                    key={expense.id}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            {expense.category}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {formatDate(expense.date)}
                          </span>
                        </div>
                        <h3 className="truncate text-lg font-bold text-slate-900">
                          {expense.merchant}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {expense.paymentMethod ?? 'Payment method not specified'}
                        </p>
                        {expense.description && (
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {expense.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <p className="text-xl font-bold tabular-nums text-slate-950">
                          {formatAmount(expense.amount)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            onClick={() => startEditing(expense)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                            disabled={deletingId === expense.id}
                            onClick={() => void handleDelete(expense)}
                            type="button"
                          >
                            {deletingId === expense.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
