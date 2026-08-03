import { NativeModule, requireNativeModule } from 'expo';

declare class RestActivityModule extends NativeModule {
  startRestActivity(exerciseName: string, endAtMs: number): Promise<boolean>;
  updateRestActivity(endAtMs: number): void;
  endRestActivity(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<RestActivityModule>('RestActivity');
