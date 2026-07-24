import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useCalendarEvents, useCreateEvent, useDeleteEvent } from '../../hooks/useCalendarEvents';
import type { CalendarEvent } from '../../api/calendarEvents';
import { Card } from '../ui/Card';
import { ChipSelect } from '../ui/ChipSelect';
import { calendarTheme, colors, radii, spacing, typography } from '../../lib/theme';

type TimingMode = 'all_day' | 'timed';

const timingOptions: { value: TimingMode; label: string }[] = [
  { value: 'all_day', label: 'All day' },
  { value: 'timed', label: 'Set time' },
];

export function CalendarView() {
  const { data: events = [] } = useCalendarEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [title, setTitle] = useState('');
  const [timing, setTiming] = useState<TimingMode>('all_day');
  const [time, setTime] = useState('');

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const date = dayjs(event.start_at).format('YYYY-MM-DD');
      (map[date] ??= []).push(event);
    }
    return map;
  }, [events]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string }> = {};
    for (const date of Object.keys(eventsByDate)) {
      marks[date] = { marked: true };
    }
    marks[selectedDate] = { ...(marks[selectedDate] ?? {}), selected: true, selectedColor: colors.accent };
    return marks;
  }, [eventsByDate, selectedDate]);

  const dayEvents = eventsByDate[selectedDate] ?? [];

  const onAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (timing === 'timed' && !/^\d{2}:\d{2}$/.test(time)) return;

    const startAt =
      timing === 'timed'
        ? dayjs(`${selectedDate} ${time}`).toISOString()
        : dayjs(selectedDate).startOf('day').toISOString();

    createEvent.mutate(
      { title: trimmed, start_at: startAt, all_day: timing === 'all_day' },
      {
        onSuccess: () => {
          setTitle('');
          setTime('');
          setTiming('all_day');
        },
      }
    );
  };

  return (
    <View>
      <Card style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={calendarTheme}
        />
      </Card>

      <Card style={{ marginTop: spacing.sm }}>
        <Text style={typography.heading}>{dayjs(selectedDate).format('dddd, MMMM D')}</Text>

        <View style={{ marginTop: spacing.sm }}>
          {dayEvents.length === 0 && <Text style={typography.caption}>No events on this day.</Text>}
          {dayEvents.map((event) => (
            <View key={event.id} style={styles.eventRow}>
              <View style={{ flex: 1 }}>
                <Text style={typography.body}>{event.title}</Text>
                <Text style={typography.caption}>
                  {event.all_day ? 'All day' : dayjs(event.start_at).format('h:mm A')}
                </Text>
              </View>
              <Pressable onPress={() => deleteEvent.mutate(event.id)} hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={{ marginTop: spacing.md }}>
          <TextInput
            style={styles.input}
            placeholder="Event title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <View style={{ marginTop: spacing.sm }}>
            <ChipSelect options={timingOptions} value={timing} onChange={setTiming} />
          </View>
          {timing === 'timed' && (
            <TextInput
              style={[styles.input, { marginTop: spacing.sm }]}
              placeholder="Time (HH:MM, 24-hour)"
              placeholderTextColor={colors.textMuted}
              value={time}
              onChangeText={setTime}
            />
          )}
          <Pressable style={styles.addButton} onPress={onAdd} disabled={createEvent.isPending}>
            <Text style={styles.addButtonText}>{createEvent.isPending ? 'Adding…' : 'Add event'}</Text>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    padding: 0,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
