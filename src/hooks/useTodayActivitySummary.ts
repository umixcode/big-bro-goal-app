import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ensureHealthKitAuthorized,
  getActiveEnergyBurnedForDate,
  getStepTotalForDate,
  isHealthKitSupported,
} from '../lib/healthkit';

export interface TodayActivitySummary {
  steps: number;
  activeCalories: number;
}

// Reads live from HealthKit rather than the synced steps_logs table, so this
// doesn't depend on the Trackers tab having been opened that day.
export function useActivitySummaryForDate(date: string | undefined) {
  return useQuery({
    queryKey: ['activitySummary', date],
    queryFn: async (): Promise<TodayActivitySummary> => {
      const authorized = await ensureHealthKitAuthorized();
      if (!authorized) return { steps: 0, activeCalories: 0 };
      const [steps, activeCalories] = await Promise.all([
        getStepTotalForDate(date as string),
        getActiveEnergyBurnedForDate(date as string),
      ]);
      return { steps, activeCalories };
    },
    enabled: isHealthKitSupported() && !!date,
    staleTime: 60_000,
  });
}

export function useTodayActivitySummary() {
  return useActivitySummaryForDate(dayjs().format('YYYY-MM-DD'));
}
