import { lbToKg } from './units';
import type { ExerciseHistoryRow } from '../api/loggedSets';

export type OverloadDirection = 'up' | 'down' | 'same' | 'none';

export function toKg(weight: number, unit: 'lb' | 'kg'): number {
  return unit === 'kg' ? weight : lbToKg(weight);
}

// Compares two top-set weights (already normalized to kg), with a small
// epsilon so near-equal float values read as "same" rather than up/down noise.
export function compareOverload(currentKg: number | null, previousKg: number | null): OverloadDirection {
  if (currentKg == null || previousKg == null) return 'none';
  const deltaKg = currentKg - previousKg;
  if (Math.abs(deltaKg) < 0.25) return 'same';
  return deltaKg > 0 ? 'up' : 'down';
}

// Reduces raw (session, weight, unit) rows into one top set per session date,
// sorted chronologically.
export function groupTopSetsByDate(rows: ExerciseHistoryRow[]): { date: string; weightKg: number }[] {
  const bestByDate = new Map<string, number>();
  for (const row of rows) {
    const date = row.session?.session_date;
    if (!date) continue;
    const kg = toKg(row.weight, row.weight_unit);
    bestByDate.set(date, Math.max(bestByDate.get(date) ?? 0, kg));
  }
  return [...bestByDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, weightKg]) => ({ date, weightKg }));
}
