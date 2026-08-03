import { useEffect } from 'react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import {
  isHealthKitSupported,
  ensureHealthKitAuthorized,
  getLatestWeightKg,
  getTodayStepTotal,
  getDistanceForDate,
  getFlightsClimbedForDate,
  getExerciseMinutesForDate,
  getActiveEnergyBurnedForDate,
  getLastNightSleepAggregate,
  getAverageHeartRateForRange,
  getAverageHRVForRange,
  getAverageRespiratoryRateForRange,
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

      const [weight, steps, distance, floors, exerciseMinutes, activeCalories, sleep] = await Promise.allSettled([
        getLatestWeightKg(),
        getTodayStepTotal(),
        getDistanceForDate(today),
        getFlightsClimbedForDate(today),
        getExerciseMinutesForDate(today),
        getActiveEnergyBurnedForDate(today),
        getLastNightSleepAggregate(),
      ]);

      if (cancelled) return;

      // Each sync is independent — one failing (e.g. a bad value HealthKit
      // returns) must not block the others from saving.
      if (weight.status === 'fulfilled' && weight.value) {
        try {
          await upsertWeightLog({ date: weight.value.date, weight_kg: weight.value.weightKg, source: 'healthkit' });
          queryClient.invalidateQueries({ queryKey: ['weightLogs'] });
        } catch {
          // Best-effort background sync — surfacing this would just be noise
          // on every tab open; manual entry remains available as a fallback.
        }
      }

      if (steps.status === 'fulfilled') {
        try {
          await upsertStepsLog({
            date: today,
            steps: steps.value,
            source: 'healthkit',
            distance_m: distance.status === 'fulfilled' ? distance.value : null,
            floors_climbed: floors.status === 'fulfilled' ? floors.value : null,
            active_minutes: exerciseMinutes.status === 'fulfilled' ? exerciseMinutes.value : null,
            active_calories: activeCalories.status === 'fulfilled' ? activeCalories.value : null,
          });
          queryClient.invalidateQueries({ queryKey: ['stepsLog', today] });
        } catch {
          // See weight sync above.
        }
      }

      if (sleep.status === 'fulfilled' && sleep.value) {
        const aggregate = sleep.value;
        const sleepGoalHours = goals?.sleep_goal_hours ?? 8;

        // Heart rate/HRV/breathing are queried scoped to the sleep window
        // itself (not the calendar day), so they only need to run once the
        // window is known — same best-effort, independent-failure handling
        // as the syncs above.
        const [heartRate, hrv, respiratoryRate] = await Promise.allSettled([
          getAverageHeartRateForRange(aggregate.start_time, aggregate.end_time),
          getAverageHRVForRange(aggregate.start_time, aggregate.end_time),
          getAverageRespiratoryRateForRange(aggregate.start_time, aggregate.end_time),
        ]);

        try {
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
            avg_heart_rate_bpm: heartRate.status === 'fulfilled' ? heartRate.value : null,
            avg_hrv_ms: hrv.status === 'fulfilled' ? hrv.value : null,
            avg_respiratory_rate: respiratoryRate.status === 'fulfilled' ? respiratoryRate.value : null,
            stage_segments: aggregate.segments,
          });
          queryClient.invalidateQueries({ queryKey: ['sleepLog', aggregate.date] });
        } catch {
          // See weight sync above.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
