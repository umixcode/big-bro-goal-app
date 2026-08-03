import dayjs, { type Dayjs } from 'dayjs';
import * as Notifications from 'expo-notifications';
import { BUILD_DATE } from './buildInfo';

// Free (non-Program) Apple ID signing certificates expire 7 days after the
// build/signing date — after that the app refuses to open until reinstalled
// via USB from a Mac.
export const CERT_LIFETIME_DAYS = 7;
const REMINDER_LEAD_HOURS = 24;
const REMINDER_NOTIFICATION_ID = 'cert-expiry-reminder';

export function getCertExpiryDate(): Dayjs {
  return dayjs(BUILD_DATE).add(CERT_LIFETIME_DAYS, 'day');
}

export async function scheduleCertExpiryReminder(): Promise<void> {
  const expiresAt = getCertExpiryDate();
  const remindAt = expiresAt.subtract(REMINDER_LEAD_HOURS, 'hour');

  // Clear any previously scheduled reminder first — BUILD_DATE changes on
  // every rebuild, so a stale schedule from a prior install would
  // otherwise fire at the wrong time.
  await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID).catch(() => {});

  if (!remindAt.isAfter(dayjs())) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    if (requested !== 'granted') return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'Big Bro needs a reinstall soon',
      body: `Your app's signing certificate expires ${expiresAt.format('MMM D, h:mm A')} — plug into your Mac to reinstall before then.`,
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindAt.toDate() },
  });
}
