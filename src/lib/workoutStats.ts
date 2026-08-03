import dayjs from 'dayjs';
import { lbToKg } from './units';
import { nameTriggersRestDay, type LastCompletedDay } from '../api/workoutSessions';
import type { ExerciseHistoryRow } from '../api/loggedSets';
import type { WorkoutPhaseDay } from '../api/workoutPrograms';

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

// Extracts a single target rep count from a prescription string like "5" or
// "6-8", taking the lower bound of a range as the number the row is seeded
// with (the harder end is left for the lifter to reach for manually).
export function parseTargetReps(repsRange: string | null, fallback = 8): number {
  const match = repsRange?.match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

// Turns a prescribed rest string like "90s", "2-3 min", or "3 min" into a
// countdown starting point in seconds. Ranges are averaged; a bare number
// with no unit is treated as seconds.
export function parseRestSeconds(rest: string | null, fallback = 90): number {
  if (!rest) return fallback;
  const numbers = rest.match(/\d+(\.\d+)?/g)?.map(Number);
  if (!numbers || numbers.length === 0) return fallback;
  const value = numbers.length > 1 ? (numbers[0] + numbers[1]) / 2 : numbers[0];
  const isMinutes = /min/i.test(rest);
  return Math.round(isMinutes ? value * 60 : value);
}

export interface SessionHistoryEntry {
  date: string;
  sets: { weightKg: number; reps: number }[];
  topWeightKg: number;
  topReps: number;
}

// Groups raw (session, weight, reps) rows into one entry per session date,
// keeping every set that day (not just the top one) so the UI can show a
// per-set breakdown, sorted chronologically.
export function groupSessionsByDate(rows: ExerciseHistoryRow[]): SessionHistoryEntry[] {
  const byDate = new Map<string, { weightKg: number; reps: number }[]>();
  for (const row of rows) {
    const date = row.session?.session_date;
    if (!date) continue;
    const list = byDate.get(date) ?? [];
    list.push({ weightKg: toKg(row.weight, row.weight_unit), reps: row.reps });
    byDate.set(date, list);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, sets]) => {
      // Weight takes priority over reps: 155x6 beats 135x8, and reps only
      // break a tie when weight is equal.
      const top = sets.reduce((best, s) => {
        if (s.weightKg !== best.weightKg) return s.weightKg > best.weightKg ? s : best;
        return s.reps > best.reps ? s : best;
      }, sets[0]);
      return { date, sets, topWeightKg: top.weightKg, topReps: top.reps };
    });
}

// Picks the standout session from a range using the same weight-first,
// reps-as-tiebreaker priority as the per-session top set above.
export function pickBestSession(sessions: SessionHistoryEntry[]): SessionHistoryEntry | null {
  if (sessions.length === 0) return null;
  return sessions.reduce((best, s) => {
    if (s.topWeightKg !== best.topWeightKg) return s.topWeightKg > best.topWeightKg ? s : best;
    return s.topReps > best.topReps ? s : best;
  }, sessions[0]);
}

export type AssignedDay = { kind: 'workout'; day: WorkoutPhaseDay } | { kind: 'rest' };

// Figures out what today's slot in the rotation should be, given the
// ordered program days and the most recently fully-completed one. Rest
// days aren't stored as phase days — they're inferred as the single day
// immediately following a day that triggers one (Legs, Lower). Skipping
// further than that just moves on to the next real workout rather than
// showing a stale rest day indefinitely.
export function resolveAssignedDay(
  orderedDays: WorkoutPhaseDay[],
  lastCompleted: LastCompletedDay | null,
  todayDate: string
): AssignedDay {
  if (orderedDays.length === 0) return { kind: 'rest' };
  if (!lastCompleted) return { kind: 'workout', day: orderedDays[0] };

  const lastIndex = orderedDays.findIndex((d) => d.id === lastCompleted.phaseDayId);
  if (lastIndex === -1) return { kind: 'workout', day: orderedDays[0] };

  const daysSince = dayjs(todayDate).diff(dayjs(lastCompleted.date), 'day');
  if (daysSince <= 0) {
    return { kind: 'workout', day: orderedDays[lastIndex] };
  }

  if (daysSince === 1 && nameTriggersRestDay(orderedDays[lastIndex].day_name)) {
    return { kind: 'rest' };
  }

  const nextIndex = (lastIndex + 1) % orderedDays.length;
  return { kind: 'workout', day: orderedDays[nextIndex] };
}

// Previews what the rotation would assign on some future date, assuming
// every day between now and then gets completed on schedule. resolveAssignedDay
// only ever advances a single rotation slot for any date after the last
// completed one — asking it for a distant date directly collapses to
// "whatever's immediately next" regardless of how far out that date is, so
// this walks the simulated timeline forward one day at a time instead.
export function projectAssignedDay(
  orderedDays: WorkoutPhaseDay[],
  lastCompleted: LastCompletedDay | null,
  targetDate: string
): AssignedDay {
  if (orderedDays.length === 0) return { kind: 'rest' };
  if (!lastCompleted) return { kind: 'workout', day: orderedDays[0] };
  if (!dayjs(targetDate).isAfter(lastCompleted.date, 'day')) {
    return resolveAssignedDay(orderedDays, lastCompleted, targetDate);
  }

  let cursorCompleted = lastCompleted;
  let cursorDate = lastCompleted.date;
  let result: AssignedDay = { kind: 'rest' };

  while (dayjs(cursorDate).isBefore(targetDate, 'day')) {
    const nextDate = dayjs(cursorDate).add(1, 'day').format('YYYY-MM-DD');
    result = resolveAssignedDay(orderedDays, cursorCompleted, nextDate);
    if (result.kind === 'workout') {
      cursorCompleted = { phaseDayId: result.day.id, dayName: result.day.day_name, date: nextDate };
    }
    cursorDate = nextDate;
  }

  return result;
}
