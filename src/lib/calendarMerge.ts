import dayjs from 'dayjs';
import type { CalendarEvent } from '../api/calendarEvents';
import type { DeviceCalendarEvent } from './deviceCalendar';
import { colors } from './theme';

export interface DisplayEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  source: 'app' | 'device';
  deviceCalendarTitle?: string;
  deviceCalendarColor?: string | null;
  category?: CalendarEvent['category'];
}

export function toDisplayEvents(appEvents: CalendarEvent[], deviceEvents: DeviceCalendarEvent[]): DisplayEvent[] {
  const fromApp: DisplayEvent[] = appEvents.map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.start_at,
    endAt: event.end_at,
    allDay: event.all_day,
    source: 'app',
    category: event.category,
  }));

  const fromDevice: DisplayEvent[] = deviceEvents.map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: event.allDay,
    source: 'device',
    deviceCalendarTitle: event.calendarTitle,
    deviceCalendarColor: event.calendarColor,
  }));

  return [...fromApp, ...fromDevice].sort((a, b) => (a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0));
}

export function buildMarkedDates(
  displayEvents: DisplayEvent[],
  selectedDate: string
): Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string }> {
  const marks: Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string }> = {};
  for (const event of displayEvents) {
    const date = dayjs(event.startAt).format('YYYY-MM-DD');
    marks[date] = { marked: true };
  }
  marks[selectedDate] = { ...(marks[selectedDate] ?? {}), selected: true, selectedColor: colors.accent };
  return marks;
}
