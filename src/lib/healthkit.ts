import { Platform } from 'react-native';
import dayjs from 'dayjs';
import {
  isHealthDataAvailable,
  requestAuthorization,
  getMostRecentQuantitySample,
  queryStatisticsForQuantity,
  queryCategorySamples,
} from '@kingstinct/react-native-healthkit';
import { aggregateSleepSamples, type SleepAggregate } from './sleepAggregation';

const READ_TYPES = [
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKCategoryTypeIdentifierSleepAnalysis',
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
