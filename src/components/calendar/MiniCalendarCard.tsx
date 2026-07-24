import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { Card } from '../ui/Card';
import { calendarTheme, colors } from '../../lib/theme';

export function MiniCalendarCard() {
  const router = useRouter();
  const { data: events = [] } = useCalendarEvents();
  const today = dayjs().format('YYYY-MM-DD');

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string }> = {};
    for (const event of events) {
      const date = dayjs(event.start_at).format('YYYY-MM-DD');
      marks[date] = { marked: true };
    }
    marks[today] = { ...(marks[today] ?? {}), selected: true, selectedColor: colors.accent };
    return marks;
  }, [events, today]);

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Calendar
        current={today}
        markedDates={markedDates}
        onDayPress={() => router.push('/(tabs)/calendar')}
        theme={calendarTheme}
      />
    </Card>
  );
}
