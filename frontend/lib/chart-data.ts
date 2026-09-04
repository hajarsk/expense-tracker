import type { CategorySummary, MonthlySummary } from '@/lib/expense';

export interface CategoryChartItem extends CategorySummary {
  widthPercent: number;
}

export interface MonthlyChartItem extends MonthlySummary {
  heightPercent: number;
}

function toNonNegativeNumber(value: string) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

export function buildCategoryChartData(
  categories: CategorySummary[],
): CategoryChartItem[] {
  return categories.map((category) => ({
    ...category,
    widthPercent: Math.min(100, toNonNegativeNumber(category.percentage)),
  }));
}

export function buildMonthlyChartData(
  months: MonthlySummary[],
): MonthlyChartItem[] {
  const largestTotal = Math.max(
    0,
    ...months.map((month) => toNonNegativeNumber(month.totalSpending)),
  );

  return months.map((month) => ({
    ...month,
    heightPercent:
      largestTotal === 0
        ? 0
        : (toNonNegativeNumber(month.totalSpending) / largestTotal) * 100,
  }));
}

