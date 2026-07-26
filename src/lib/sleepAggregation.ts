// Numeric values mirror HealthKit's CategoryValueSleepAnalysis enum
// (inBed=0, asleepUnspecified=1, awake=2, asleepCore=3, asleepDeep=4, asleepREM=5),
// duplicated here (rather than importing the HealthKit package) so this file
// stays a pure, dependency-free, unit-testable function.
const IN_BED = 0;
const ASLEEP_UNSPECIFIED = 1;
const AWAKE = 2;
const ASLEEP_CORE = 3;
const ASLEEP_DEEP = 4;
const ASLEEP_REM = 5;

export interface SleepCategorySample {
  value: number;
  startDate: Date;
  endDate: Date;
}

export interface SleepAggregate {
  total_minutes: number;
  rem_minutes: number | null;
  light_minutes: number | null;
  deep_minutes: number | null;
  awake_minutes: number | null;
  start_time: string;
  end_time: string;
  date: string;
}

export function aggregateSleepSamples(samples: SleepCategorySample[]): SleepAggregate | null {
  if (samples.length === 0) return null;

  let totalMinutes = 0;
  let rem = 0;
  let light = 0;
  let deep = 0;
  let awake = 0;
  let hasRem = false;
  let hasLight = false;
  let hasDeep = false;
  let hasAwake = false;
  let minStart = samples[0].startDate;
  let maxEnd = samples[0].endDate;

  for (const sample of samples) {
    const minutes = (sample.endDate.getTime() - sample.startDate.getTime()) / 60_000;
    if (sample.startDate < minStart) minStart = sample.startDate;
    if (sample.endDate > maxEnd) maxEnd = sample.endDate;

    switch (sample.value) {
      case ASLEEP_CORE:
        light += minutes;
        hasLight = true;
        totalMinutes += minutes;
        break;
      case ASLEEP_DEEP:
        deep += minutes;
        hasDeep = true;
        totalMinutes += minutes;
        break;
      case ASLEEP_REM:
        rem += minutes;
        hasRem = true;
        totalMinutes += minutes;
        break;
      case ASLEEP_UNSPECIFIED:
        // Legacy "asleep" with no stage detail (typical for iPhone-only sleep
        // tracking without an Apple Watch) — counts toward total_minutes but
        // has no specific stage bucket.
        totalMinutes += minutes;
        break;
      case AWAKE:
        awake += minutes;
        hasAwake = true;
        break;
      case IN_BED:
        // Not counted as "asleep" time, matching Apple Health's own
        // "time asleep" vs "time in bed" distinction.
        break;
      default:
        break;
    }
  }

  if (totalMinutes === 0) return null;

  return {
    total_minutes: Math.round(totalMinutes),
    rem_minutes: hasRem ? Math.round(rem) : null,
    light_minutes: hasLight ? Math.round(light) : null,
    deep_minutes: hasDeep ? Math.round(deep) : null,
    awake_minutes: hasAwake ? Math.round(awake) : null,
    start_time: minStart.toISOString(),
    end_time: maxEnd.toISOString(),
    date: maxEnd.toISOString().slice(0, 10),
  };
}
