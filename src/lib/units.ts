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
