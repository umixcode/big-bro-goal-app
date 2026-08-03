import dayjs from 'dayjs';

export interface HeatmapDay {
  date: string;
  hasData: boolean;
  met: boolean;
}

// Builds a fixed-length run of consecutive days ending today, from a
// date->total map, so the heatmap grid always has a stable shape (12 weeks
// of 7 days) regardless of how sparse the underlying logs are.
export function buildHeatmapDays(
  totalsByDate: Map<string, number>,
  isMet: (total: number) => boolean,
  days = 84
): HeatmapDay[] {
  const today = dayjs();
  return Array.from({ length: days }, (_, i) => {
    const date = today.subtract(days - 1 - i, 'day').format('YYYY-MM-DD');
    const hasData = totalsByDate.has(date);
    const total = totalsByDate.get(date) ?? 0;
    return { date, hasData, met: hasData && isMet(total) };
  });
}

export function sumByDate(rows: { date: string; amount: number }[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.date, (totals.get(row.date) ?? 0) + row.amount);
  }
  return totals;
}
