import { useEffect } from 'react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import {
  isHealthKitSupported,
  ensureHealthKitAuthorized,
  getLatestWeightKg,
  getTodayStepTotal,
  getLastNightSleepAggregate,
} from '../lib/healthkit';
import { upsertWeightLog } from '../api/weightLogs';
import { upsertStepsLog } from '../api/stepsLogs';
import { upsertSleepLog } from '../api/sleepLogs';
import { calculateSleepScore } from '../lib/formulas';
import { useUserGoals } from './useUserGoals';

// Foreground-only sync: runs once per mount of the Trackers tab. Deliberately
// no background delivery/observers. Because both this sync and manual saves
// use plain upsert-per-write, whichever happens most recently simply
// overwrites that date's row — reopening this tab will silently re-sync and
// overwrite today's rows with current HealthKit data every time, which is the
// intended "most recently saved wins" behavior, not a bug.
export function useHealthKitSync() {
  const { data: goals } = useUserGoals();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isHealthKitSupported()) return;
    let cancelled = false;

    (async () => {
      const authorized = await ensureHealthKitAuthorized();
      if (!authorized || cancelled) return;

      const today = dayjs().format('YYYY-MM-DD');

      const [weight, steps, sleep] = await Promise.allSettled([
        getLatestWeightKg(),
        getTodayStepTotal(),
        getLastNightSleepAggregate(),
      ]);

      if (cancelled) return;

      if (weight.status === 'fulfilled' && weight.value) {
        await upsertWeightLog({ date: weight.value.date, weight_kg: weight.value.weightKg, source: 'healthkit' });
        queryClient.invalidateQueries({ queryKey: ['weightLogs'] });
      }

      if (steps.status === 'fulfilled') {
        await upsertStepsLog({ date: today, steps: steps.value, source: 'healthkit' });
        queryClient.invalidateQueries({ queryKey: ['stepsLog', today] });
      }

      if (sleep.status === 'fulfilled' && sleep.value) {
        const aggregate = sleep.value;
        const sleepGoalHours = goals?.sleep_goal_hours ?? 8;
        await upsertSleepLog({
          date: aggregate.date,
          total_minutes: aggregate.total_minutes,
          rem_minutes: aggregate.rem_minutes,
          light_minutes: aggregate.light_minutes,
          deep_minutes: aggregate.deep_minutes,
          awake_minutes: aggregate.awake_minutes,
          start_time: aggregate.start_time,
          end_time: aggregate.end_time,
          score: calculateSleepScore(aggregate.total_minutes, sleepGoalHours),
          source: 'healthkit',
        });
        queryClient.invalidateQueries({ queryKey: ['sleepLog', aggregate.date] });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
