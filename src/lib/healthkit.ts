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

export async function getTodayStepTotal(): Promise<number> {
  const startOfDay = dayjs().startOf('day').toDate();
  const now = new Date();

  const stats = await queryStatisticsForQuantity(
    'HKQuantityTypeIdentifierStepCount',
    ['cumulativeSum'],
    { filter: { date: { startDate: startOfDay, endDate: now } }, unit: 'count' }
  );

  return stats.sumQuantity?.quantity ?? 0;
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
