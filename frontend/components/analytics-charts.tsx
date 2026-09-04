import {
  buildCategoryChartData,
  buildMonthlyChartData,
} from '@/lib/chart-data';
import type { ExpenseCategory, ExpenseSummary } from '@/lib/expense';

interface AnalyticsChartsProps {
  isLoading: boolean;
  summary: ExpenseSummary;
}

const categoryBarClasses: Record<ExpenseCategory, string> = {
  'Cooked Meals': 'bg-emerald-600',
  'Non-Cooked Meals': 'bg-amber-500',
  'Non-Food': 'bg-sky-600',
};

function formatAmount(amount: string) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(Number(amount));
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);

  return new Intl.DateTimeFormat('en-MY', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

export default function AnalyticsCharts({
  isLoading,
  summary,
}: AnalyticsChartsProps) {
  const categoryData = buildCategoryChartData(summary.byCategory);
  const monthlyData = buildMonthlyChartData(summary.byMonth);
  const hasCategoryData = Number(summary.totalSpending) > 0;

  return (
    <section aria-label="Spending analytics" className="mt-8 grid gap-6 xl:grid-cols-2">
      <figure className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <figcaption>
          <h2 className="text-lg font-bold text-slate-900">
            Spending by category
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Share of spending in the current results.
          </p>
        </figcaption>

        {isLoading ? (
          <div className="mt-6 space-y-6" aria-label="Loading category chart">
            {[1, 2, 3].map((item) => (
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" key={item} />
            ))}
          </div>
        ) : !hasCategoryData ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="font-semibold text-slate-700">No category data yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add an expense or change the filters to see this chart.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-5">
            {categoryData.map((category) => (
              <li key={category.category}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700">
                    {category.category}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-slate-950">
                    {formatAmount(category.totalSpending)}
                  </span>
                </div>
                <div
                  aria-label={`${category.category}: ${formatAmount(category.totalSpending)}, ${category.percentage}% of total spending`}
                  className="h-3 overflow-hidden rounded-full bg-slate-100"
                  role="img"
                >
                  <div
                    className={`h-full min-w-px rounded-full ${categoryBarClasses[category.category]}`}
                    style={{ width: `${category.widthPercent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs tabular-nums text-slate-500">
                  {category.percentage}% of total
                </p>
              </li>
            ))}
          </ul>
        )}
      </figure>

      <figure className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <figcaption>
          <h2 className="text-lg font-bold text-slate-900">
            Monthly spending trend
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monthly totals in the current results.
          </p>
        </figcaption>

        {isLoading ? (
          <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-100" aria-label="Loading monthly chart" />
        ) : monthlyData.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="font-semibold text-slate-700">No monthly data yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add an expense or change the filters to see a trend.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto pb-2">
            <ul className="flex h-64 min-w-max items-end gap-4 border-b border-slate-200 px-1" aria-label="Monthly spending totals">
              {monthlyData.map((month) => (
                <li
                  aria-label={`${formatMonth(month.month)}: ${formatAmount(month.totalSpending)}, ${month.expenseCount} ${month.expenseCount === 1 ? 'expense' : 'expenses'}`}
                  className="flex h-full w-24 flex-col justify-end text-center"
                  key={month.month}
                >
                  <span className="mb-2 text-xs font-bold tabular-nums text-slate-700">
                    {formatAmount(month.totalSpending)}
                  </span>
                  <div className="flex h-40 items-end justify-center">
                    <div
                      className="w-12 rounded-t-lg bg-emerald-600 transition-[height] duration-300"
                      style={{
                        height: `${Math.max(month.heightPercent, 2)}%`,
                      }}
                    />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-600">
                    {formatMonth(month.month)}
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-400">
                    {month.expenseCount} {month.expenseCount === 1 ? 'item' : 'items'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </figure>
    </section>
  );
}

