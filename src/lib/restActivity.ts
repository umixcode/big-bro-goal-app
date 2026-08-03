import { Platform } from 'react-native';

// Thin wrapper around the native Live Activity bridge (iOS only). Guarded so
// the app still works before the native module exists / on platforms that
// don't support it — every call is a safe no-op until the module is linked.
let nativeModule: {
  startRestActivity(exerciseName: string, endAtMs: number): Promise<boolean>;
  updateRestActivity(endAtMs: number): void;
  endRestActivity(): void;
} | null = null;

if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    nativeModule = require('../../modules/rest-activity').default;
  } catch {
    nativeModule = null;
  }
}

export function startRestActivity(exerciseName: string, endAtMs: number): void {
  nativeModule?.startRestActivity(exerciseName, endAtMs).catch(() => {});
}

export function updateRestActivity(endAtMs: number): void {
  nativeModule?.updateRestActivity(endAtMs);
}

export function endRestActivity(): void {
  nativeModule?.endRestActivity();
}
