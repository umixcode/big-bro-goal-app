import { workoutTheme } from './theme';
import type { DaySummary } from '../api/workoutSessions';

export interface DayVisual {
  fill: string;
  borderColor: string | null;
  showX: boolean;
}

// Complete stays a solid filled circle. Partial is an outlined ring rather
// than a fill, so it doesn't read as "done". None only becomes a missed X
// once the day has actually passed and the account existed yet — a day
// before signup or still in the future is just neutral, not a strike.
export function getDayVisual(
  status: DaySummary['status'],
  opts: { isPast: boolean; isBeforeSignup: boolean }
): DayVisual {
  if (status === 'complete') {
    return { fill: workoutTheme.accent, borderColor: null, showX: false };
  }
  if (status === 'partial') {
    return { fill: 'transparent', borderColor: workoutTheme.accent, showX: false };
  }
  const missed = opts.isPast && !opts.isBeforeSignup;
  return { fill: 'transparent', borderColor: workoutTheme.border, showX: missed };
}
