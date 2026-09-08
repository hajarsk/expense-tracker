import assert from 'node:assert/strict';

const baseUrl = process.env.API_URL ?? 'http://localhost:3001';
const createdIds = [];

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

function localDate(dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000+08:00`;
}

async function createExpense(merchant, amount, category, date) {
  const result = await request('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      merchant,
      amount,
      category,
      date,
      description: '[Release check]',
    }),
  });
  assert.equal(result.status, 201);
  createdIds.push(result.body.id);
  return result.body;
}

const toCents = (amount) => Math.round(Number(amount) * 100);

try {
  const today = await createExpense(
    'Release Today',
    10.1,
    'Cooked Meals',
    localDate(0),
  );
  const past = await createExpense(
    'Release Past',
    20.2,
    'Non-Cooked Meals',
    localDate(-1),
  );
  const older = await createExpense(
    'Release Older',
    30.3,
    'Non-Food',
    '2026-05-15T00:00:00.000+08:00',
  );

  const read = await request(`/expenses/${today.id}`);
  assert.equal(read.status, 200);
  assert.equal(read.body.merchant, 'Release Today');

  const updated = await request(`/expenses/${past.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ amount: 25.25, merchant: 'Release Updated' }),
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.amount, '25.25');

  const future = await request('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      merchant: 'Future',
      amount: 1,
      category: 'Cooked Meals',
      date: localDate(1),
    }),
  });
  assert.equal(future.status, 400);

  const futurePatch = await request(`/expenses/${older.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ date: localDate(1) }),
  });
  assert.equal(futurePatch.status, 400);

  const invalidCategory = await request('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      merchant: 'Invalid',
      amount: 1,
      category: 'Travel',
      date: localDate(0),
    }),
  });
  assert.equal(invalidCategory.status, 400);

  for (const category of ['Cooked Meals', 'Non-Cooked Meals', 'Non-Food']) {
    const filtered = await request(
      `/expenses?category=${encodeURIComponent(category)}`,
    );
    assert.equal(filtered.status, 200);
    assert.ok(filtered.body.length > 0);
    assert.ok(filtered.body.every((expense) => expense.category === category));
  }

  const dateFiltered = await request(
    '/expenses?startDate=2026-05-01T00%3A00%3A00.000Z&endDateExclusive=2026-06-01T00%3A00%3A00.000Z',
  );
  assert.ok(
    dateFiltered.body.every(
      (expense) => expense.date >= '2026-05-01' && expense.date < '2026-06-01',
    ),
  );

  const comparisons = {
    newest: (a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id,
    oldest: (a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id,
    highest: (a, b) =>
      Number(b.amount) - Number(a.amount) ||
      new Date(b.date) - new Date(a.date) ||
      b.id - a.id,
    lowest: (a, b) =>
      Number(a.amount) - Number(b.amount) ||
      new Date(b.date) - new Date(a.date) ||
      b.id - a.id,
  };

  for (const [sort, compare] of Object.entries(comparisons)) {
    const result = await request(`/expenses?sort=${sort}`);
    const expectedIds = [...result.body].sort(compare).map(({ id }) => id);
    assert.deepEqual(
      result.body.map(({ id }) => id),
      expectedIds,
    );
  }

  const allExpenses = (await request('/expenses')).body;
  const summary = (await request('/expenses/summary?timezoneOffset=0')).body;
  const totalCents = allExpenses.reduce(
    (total, expense) => total + toCents(expense.amount),
    0,
  );
  assert.equal(toCents(summary.totalSpending), totalCents);
  assert.equal(summary.expenseCount, allExpenses.length);
  assert.equal(
    toCents(summary.averageExpense),
    Math.round(totalCents / allExpenses.length),
  );
  assert.equal(
    summary.byCategory.reduce(
      (total, item) => total + toCents(item.totalSpending),
      0,
    ),
    totalCents,
  );
  assert.equal(
    summary.byMonth.reduce(
      (total, item) => total + toCents(item.totalSpending),
      0,
    ),
    totalCents,
  );
  assert.equal(
    summary.byMonth.reduce((total, item) => total + item.expenseCount, 0),
    allExpenses.length,
  );
  assert.ok(summary.byMonth.length > 1);

  const emptyQuery =
    'startDate=2099-01-01T00%3A00%3A00.000Z&endDateExclusive=2099-02-01T00%3A00%3A00.000Z';
  const emptyExpenses = await request(`/expenses?${emptyQuery}`);
  const emptySummary = await request(`/expenses/summary?${emptyQuery}`);
  assert.deepEqual(emptyExpenses.body, []);
  assert.equal(emptySummary.body.totalSpending, '0.00');
  assert.deepEqual(emptySummary.body.byMonth, []);

  console.log('Release API checks passed.');
} finally {
  for (const id of createdIds) {
    await request(`/expenses/${id}`, { method: 'DELETE' });
  }
}
