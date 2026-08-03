export const kgToLb = (kg: number) => kg * 2.20462262;
export const lbToKg = (lb: number) => lb / 2.20462262;
export const cmToIn = (cm: number) => cm / 2.54;
export const inToCm = (inches: number) => inches * 2.54;

export function formatWeight(kg: number | null | undefined, unitsPreference: 'metric' | 'imperial'): string {
  if (kg == null) return '';
  return unitsPreference === 'metric' ? kg.toFixed(1) : kgToLb(kg).toFixed(1);
}

export function parseWeightToKg(value: number, unitsPreference: 'metric' | 'imperial'): number {
  return unitsPreference === 'metric' ? value : lbToKg(value);
}

export function formatHeight(cm: number | null | undefined, unitsPreference: 'metric' | 'imperial'): string {
  if (cm == null) return '';
  return unitsPreference === 'metric' ? cm.toFixed(0) : cmToIn(cm).toFixed(1);
}

export function parseHeightToCm(value: number, unitsPreference: 'metric' | 'imperial'): number {
  return unitsPreference === 'metric' ? value : inToCm(value);
}

export function formatDurationHM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

const METERS_PER_MILE = 1609.344;

export function formatDistance(meters: number, unitsPreference: 'metric' | 'imperial'): string {
  if (unitsPreference === 'metric') return `${(meters / 1000).toFixed(2)} km`;
  return `${(meters / METERS_PER_MILE).toFixed(2)} mi`;
}
