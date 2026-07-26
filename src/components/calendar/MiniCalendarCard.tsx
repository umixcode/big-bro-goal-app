import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { useDeviceCalendarEvents } from '../../hooks/useDeviceCalendarEvents';
import { toDisplayEvents, buildMarkedDates } from '../../lib/calendarMerge';
import { Card } from '../ui/Card';
import { calendarTheme, spacing, typography } from '../../lib/theme';

const WINDOW_START = dayjs().subtract(30, 'day').toDate();
const WINDOW_END = dayjs().add(90, 'day').toDate();

export function MiniCalendarCard() {
  const router = useRouter();
  const { data: events = [] } = useCalendarEvents();
  const { data: deviceEvents = [] } = useDeviceCalendarEvents(WINDOW_START, WINDOW_END);
  const today = dayjs().format('YYYY-MM-DD');

  const displayEvents = useMemo(() => toDisplayEvents(events, deviceEvents), [events, deviceEvents]);
  const markedDates = useMemo(() => buildMarkedDates(displayEvents, today), [displayEvents, today]);

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Text style={[typography.eyebrow, { padding: spacing.md, paddingBottom: 0 }]}>Calendar</Text>
      <Calendar
        current={today}
        markedDates={markedDates}
        onDayPress={() => router.push('/(tabs)/calendar')}
        theme={calendarTheme}
      />
    </Card>
  );
}
