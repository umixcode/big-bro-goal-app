import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

export interface DeviceCalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  calendarTitle: string;
  calendarColor: string | null;
}

export function isDeviceCalendarSupported(): boolean {
  return Platform.OS === 'ios';
}

export async function ensureCalendarAuthorized(): Promise<boolean> {
  if (!isDeviceCalendarSupported()) return false;
  const permission = await Calendar.requestCalendarPermissions();
  return permission.granted;
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function listDeviceCalendarEvents(startDate: Date, endDate: Date): Promise<DeviceCalendarEvent[]> {
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  if (calendars.length === 0) return [];

  const events = await Calendar.listEvents(calendars, startDate, endDate);
  const calendarsById = new Map(calendars.map((cal) => [cal.id, cal]));

  return events.map((event) => {
    const calendar = calendarsById.get(event.calendarId);
    return {
      id: event.id,
      title: event.title,
      startAt: toIsoString(event.startDate),
      endAt: event.endDate ? toIsoString(event.endDate) : null,
      allDay: event.allDay,
      calendarTitle: calendar?.title ?? 'Apple Calendar',
      calendarColor: calendar?.color ?? null,
    };
  });
}
