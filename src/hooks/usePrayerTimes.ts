import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getIqamaSettings } from '../api/iqamaSettings';
import { getPrayerTimesForDate, upsertPrayerTimes, type PrayerTimesCache } from '../api/prayerTimes';
import { getCurrentCoordinates } from '../lib/location';
import { calculatePrayerTimes, DEFAULT_CALCULATION_METHOD, DEFAULT_SCHOOL } from '../lib/prayerTimes';

export interface PrayerRow {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  name: string;
  athan: string;
  iqama: string;
}

const PRAYER_DEFS: { key: PrayerRow['key']; name: string; offsetKey: keyof Awaited<ReturnType<typeof getIqamaSettings>> }[] = [
  { key: 'fajr', name: 'Fajr', offsetKey: 'fajr_offset_minutes' },
  { key: 'dhuhr', name: 'Dhuhr', offsetKey: 'dhuhr_offset_minutes' },
  { key: 'asr', name: 'Asr', offsetKey: 'asr_offset_minutes' },
  { key: 'maghrib', name: 'Maghrib', offsetKey: 'maghrib_offset_minutes' },
  { key: 'isha', name: 'Isha', offsetKey: 'isha_offset_minutes' },
];

async function ensureTodaysCache(today: string): Promise<PrayerTimesCache | null> {
  const existing = await getPrayerTimesForDate(today);
  if (existing) return existing;

  const coords = await getCurrentCoordinates();
  if (!coords) return null;

  const times = calculatePrayerTimes(coords.latitude, coords.longitude, new Date());
  return upsertPrayerTimes({
    date: today,
    latitude: coords.latitude,
    longitude: coords.longitude,
    calculation_method: DEFAULT_CALCULATION_METHOD,
    school: DEFAULT_SCHOOL,
    fajr: dayjs(times.fajr).format('HH:mm:ss'),
    sunrise: dayjs(times.sunrise).format('HH:mm:ss'),
    dhuhr: dayjs(times.dhuhr).format('HH:mm:ss'),
    asr: dayjs(times.asr).format('HH:mm:ss'),
    maghrib: dayjs(times.maghrib).format('HH:mm:ss'),
    isha: dayjs(times.isha).format('HH:mm:ss'),
  });
}

export function useTodayPrayerTimes() {
  const today = dayjs().format('YYYY-MM-DD');

  return useQuery({
    queryKey: ['prayerTimes', today],
    queryFn: async (): Promise<PrayerRow[] | null> => {
      const cache = await ensureTodaysCache(today);
      if (!cache) return null;

      const iqamaSettings = await getIqamaSettings();

      return PRAYER_DEFS.map(({ key, name, offsetKey }) => {
        const athanMoment = dayjs(`${today} ${cache[key]}`);
        const offsetMinutes = iqamaSettings[offsetKey] as number;
        return {
          key,
          name,
          athan: athanMoment.format('h:mm A'),
          iqama: athanMoment.add(offsetMinutes, 'minute').format('h:mm A'),
        };
      });
    },
  });
}
