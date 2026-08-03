import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';

// Numeric codes stored in prayer_times_cache.calculation_method — our own
// mapping since the schema just calls for an int, not an external standard.
const METHOD_FACTORIES = [
  CalculationMethod.MuslimWorldLeague,
  CalculationMethod.Egyptian,
  CalculationMethod.Karachi,
  CalculationMethod.UmmAlQura,
  CalculationMethod.Dubai,
  CalculationMethod.MoonsightingCommittee,
  CalculationMethod.NorthAmerica,
  CalculationMethod.Kuwait,
  CalculationMethod.Qatar,
  CalculationMethod.Singapore,
];

export const DEFAULT_CALCULATION_METHOD = 3; // UmmAlQura
export const DEFAULT_SCHOOL = 1; // Hanafi

export interface CalculatedPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export function calculatePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date,
  calculationMethod = DEFAULT_CALCULATION_METHOD,
  school = DEFAULT_SCHOOL
): CalculatedPrayerTimes {
  const coordinates = new Coordinates(latitude, longitude);
  const factory = METHOD_FACTORIES[calculationMethod] ?? CalculationMethod.UmmAlQura;
  const params = factory();
  params.madhab = school === 1 ? Madhab.Hanafi : Madhab.Shafi;

  const times = new PrayerTimes(coordinates, date, params);
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}
