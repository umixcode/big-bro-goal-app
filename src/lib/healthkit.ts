import { Platform } from 'react-native';
import dayjs from 'dayjs';
import {
  isHealthDataAvailable,
  requestAuthorization,
  getMostRecentQuantitySample,
  queryStatisticsForQuantity,
  queryStatisticsCollectionForQuantity,
  queryQuantitySamples,
  queryCategorySamples,
  queryWorkoutSamples,
  WorkoutActivityType,
} from '@kingstinct/react-native-healthkit';
import { aggregateSleepSamples, type SleepAggregate } from './sleepAggregation';

const READ_TYPES = [
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRespiratoryRate',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
  'HKQuantityTypeIdentifierFlightsClimbed',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKWorkoutTypeIdentifier',
  'HKWorkoutRouteTypeIdentifier',
] as const;

export function isHealthKitSupported(): boolean {
  return Platform.OS === 'ios' && isHealthDataAvailable();
}

// HealthKit's own requestAuthorization resolves immediately without
// re-prompting if the user already decided, so it's safe/cheap to call on
// every sync rather than tracking persisted grant state ourselves.
export async function ensureHealthKitAuthorized(): Promise<boolean> {
  if (!isHealthKitSupported()) return false;
  return requestAuthorization({ toRead: READ_TYPES });
}

export async function getLatestWeightKg(): Promise<{ weightKg: number; date: string } | null> {
  const sample = await getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass', 'kg');
  if (!sample) return null;
  return { weightKg: sample.quantity, date: dayjs(sample.endDate).format('YYYY-MM-DD') };
}

export async function getStepTotalForDate(date: string): Promise<number> {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  const stats = await queryStatisticsForQuantity(
    'HKQuantityTypeIdentifierStepCount',
    ['cumulativeSum'],
    { filter: { date: { startDate: startOfDay, endDate: endOfDay } }, unit: 'count' }
  );

  // steps_logs.steps is a Postgres int — HealthKit's summed count can come
  // back as a float (floating-point accumulation across samples), which
  // Postgres rejects outright rather than truncating.
  return Math.round(stats.sumQuantity?.quantity ?? 0);
}

export async function getActiveEnergyBurnedForDate(date: string): Promise<number> {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  const stats = await queryStatisticsForQuantity(
    'HKQuantityTypeIdentifierActiveEnergyBurned',
    ['cumulativeSum'],
    { filter: { date: { startDate: startOfDay, endDate: endOfDay } }, unit: 'kcal' }
  );

  return stats.sumQuantity?.quantity ?? 0;
}

export async function getTodayStepTotal(): Promise<number> {
  return getStepTotalForDate(dayjs().format('YYYY-MM-DD'));
}

export async function getTodayActiveEnergyBurned(): Promise<number> {
  return getActiveEnergyBurnedForDate(dayjs().format('YYYY-MM-DD'));
}

export async function getDistanceForDate(date: string): Promise<number> {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  const stats = await queryStatisticsForQuantity(
    'HKQuantityTypeIdentifierDistanceWalkingRunning',
    ['cumulativeSum'],
    { filter: { date: { startDate: startOfDay, endDate: endOfDay } }, unit: 'm' }
  );

  return stats.sumQuantity?.quantity ?? 0;
}

export async function getFlightsClimbedForDate(date: string): Promise<number> {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  const stats = await queryStatisticsForQuantity(
    'HKQuantityTypeIdentifierFlightsClimbed',
    ['cumulativeSum'],
    { filter: { date: { startDate: startOfDay, endDate: endOfDay } }, unit: 'count' }
  );

  return Math.round(stats.sumQuantity?.quantity ?? 0);
}

export async function getExerciseMinutesForDate(date: string): Promise<number> {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  const stats = await queryStatisticsForQuantity(
    'HKQuantityTypeIdentifierAppleExerciseTime',
    ['cumulativeSum'],
    { filter: { date: { startDate: startOfDay, endDate: endOfDay } }, unit: 'min' }
  );

  return Math.round(stats.sumQuantity?.quantity ?? 0);
}

export interface HourlyStepBucket {
  hour: number;
  steps: number;
}

export async function getHourlyStepBreakdown(date: string): Promise<HourlyStepBucket[]> {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  const collection = await queryStatisticsCollectionForQuantity(
    'HKQuantityTypeIdentifierStepCount',
    ['cumulativeSum'],
    startOfDay,
    { hour: 1 },
    { filter: { date: { startDate: startOfDay, endDate: endOfDay } }, unit: 'count' }
  );

  return collection.map((bucket) => ({
    hour: bucket.startDate ? dayjs(bucket.startDate).hour() : 0,
    steps: Math.round(bucket.sumQuantity?.quantity ?? 0),
  }));
}

export interface HeartRateSample {
  value: number;
  date: string;
}

export async function getHeartRateSamplesForDate(date: string): Promise<HeartRateSample[]> {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  const samples = await queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', {
    filter: { date: { startDate: startOfDay, endDate: endOfDay } },
    unit: 'count/min',
    ascending: true,
    limit: -1,
  });

  return samples.map((s) => ({ value: s.quantity, date: s.startDate.toISOString() }));
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  date: string;
}

export interface RouteWorkout {
  activityType: 'walking' | 'running';
  startDate: string;
  endDate: string;
  durationMinutes: number;
  distanceMeters: number;
  points: RoutePoint[];
}

// Rather than building our own GPS tracker, this reads outdoor walk/run
// routes Apple Health (iPhone or Watch) already recorded that day — same
// approach as every other tracker here (pull real data from HealthKit,
// don't re-implement what it already does). Indoor workouts of the same
// activity type carry no locations and are skipped.
export async function getRouteWorkoutsForDate(date: string): Promise<RouteWorkout[]> {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  const workouts = await queryWorkoutSamples({
    filter: { date: { startDate: startOfDay, endDate: endOfDay } },
    limit: 0,
    ascending: true,
  });

  const results: RouteWorkout[] = [];

  for (const workout of workouts) {
    if (workout.workoutActivityType !== WorkoutActivityType.walking && workout.workoutActivityType !== WorkoutActivityType.running) {
      continue;
    }

    const routes = await workout.getWorkoutRoutes();
    const points = routes
      .flatMap((route) => route.locations)
      .map((location) => ({
        latitude: location.latitude,
        longitude: location.longitude,
        date: location.date.toISOString(),
      }));

    if (points.length === 0) continue;

    const distanceStats = await workout.getStatistic('HKQuantityTypeIdentifierDistanceWalkingRunning', 'm');

    results.push({
      activityType: workout.workoutActivityType === WorkoutActivityType.running ? 'running' : 'walking',
      startDate: workout.startDate.toISOString(),
      endDate: workout.endDate.toISOString(),
      durationMinutes: Math.round(workout.duration.quantity / 60),
      distanceMeters: distanceStats?.sumQuantity?.quantity ?? 0,
      points,
    });
  }

  return results;
}

export async function getLastNightSleepAggregate(): Promise<SleepAggregate | null> {
  const from = dayjs().subtract(24, 'hour').toDate();
  const to = new Date();

  const samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
    filter: { date: { startDate: from, endDate: to } },
    limit: -1,
    ascending: true,
  });

  return aggregateSleepSamples(samples.map((s) => ({ value: s.value, startDate: s.startDate, endDate: s.endDate })));
}

// Heart rate/HRV/breathing rate averaged over the sleep window (start/end
// from the sleep aggregate above) rather than the calendar day — these are
// only meaningful as "how the body behaved while asleep", and most people's
// wake-time heart rate would otherwise dominate a full-day average.
export async function getAverageHeartRateForRange(startIso: string, endIso: string): Promise<number | null> {
  const stats = await queryStatisticsForQuantity('HKQuantityTypeIdentifierHeartRate', ['discreteAverage'], {
    filter: { date: { startDate: new Date(startIso), endDate: new Date(endIso) } },
    unit: 'count/min',
  });
  return stats.averageQuantity?.quantity ?? null;
}

export async function getAverageHRVForRange(startIso: string, endIso: string): Promise<number | null> {
  const stats = await queryStatisticsForQuantity('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', ['discreteAverage'], {
    filter: { date: { startDate: new Date(startIso), endDate: new Date(endIso) } },
    unit: 'ms',
  });
  return stats.averageQuantity?.quantity ?? null;
}

export async function getAverageRespiratoryRateForRange(startIso: string, endIso: string): Promise<number | null> {
  const stats = await queryStatisticsForQuantity('HKQuantityTypeIdentifierRespiratoryRate', ['discreteAverage'], {
    filter: { date: { startDate: new Date(startIso), endDate: new Date(endIso) } },
    unit: 'count/min',
  });
  return stats.averageQuantity?.quantity ?? null;
}
