import { useQuery } from '@tanstack/react-query';
import {
  ensureHealthKitAuthorized,
  getHourlyStepBreakdown,
  getHeartRateSamplesForDate,
  getRouteWorkoutsForDate,
  isHealthKitSupported,
  type HourlyStepBucket,
  type HeartRateSample,
  type RouteWorkout,
} from '../lib/healthkit';

// Both queried live from HealthKit rather than persisted — hourly/sample-level
// detail is too granular to store per day, and HealthKit already retains it
// on-device for any date the user picks.
export function useHourlyStepBreakdown(date: string) {
  return useQuery<HourlyStepBucket[]>({
    queryKey: ['hourlySteps', date],
    queryFn: async () => {
      const authorized = await ensureHealthKitAuthorized();
      if (!authorized) return [];
      return getHourlyStepBreakdown(date);
    },
    enabled: isHealthKitSupported(),
    staleTime: 60_000,
  });
}

export function useHeartRateSamples(date: string) {
  return useQuery<HeartRateSample[]>({
    queryKey: ['heartRateSamples', date],
    queryFn: async () => {
      const authorized = await ensureHealthKitAuthorized();
      if (!authorized) return [];
      return getHeartRateSamplesForDate(date);
    },
    enabled: isHealthKitSupported(),
    staleTime: 60_000,
  });
}

export function useRouteWorkouts(date: string) {
  return useQuery<RouteWorkout[]>({
    queryKey: ['routeWorkouts', date],
    queryFn: async () => {
      const authorized = await ensureHealthKitAuthorized();
      if (!authorized) return [];
      return getRouteWorkoutsForDate(date);
    },
    enabled: isHealthKitSupported(),
    staleTime: 60_000,
  });
}
