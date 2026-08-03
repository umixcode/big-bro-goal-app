import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { flush } from './queue';

const BACKGROUND_SYNC_TASK = 'workout-offline-sync';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await flush();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

let initialized = false;

// Wires up every trigger that should attempt to drain the offline mutation
// queue: right away at launch, whenever connectivity is regained, whenever
// the app comes back to the foreground, and — best effort, on iOS's own
// schedule, with no guarantee of timing — via a background task so logged
// workouts still make it to the server even if the app is never reopened.
export function initOfflineSync(): void {
  if (initialized) return;
  initialized = true;

  flush();

  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      flush();
    }
  });

  AppState.addEventListener('change', (state) => {
    if (state === 'active') flush();
  });

  BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, { minimumInterval: 15 }).catch(() => {
    // Background execution isn't available on this device/OS version —
    // in-app sync (above) still covers every case where the app is open.
  });
}
