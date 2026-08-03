import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useCalendarEvents, useCreateEvent, useDeleteEvent } from '../../hooks/useCalendarEvents';
import { useActionTaskDates } from '../../hooks/useActionTasks';
import { useDeviceCalendarEvents } from '../../hooks/useDeviceCalendarEvents';
import { toDisplayEvents, buildMarkedDates, type DisplayEvent } from '../../lib/calendarMerge';
import { Card } from '../ui/Card';
import { ChipSelect } from '../ui/ChipSelect';
import { calendarTheme, colors, radii, spacing, typography } from '../../lib/theme';

type TimingMode = 'all_day' | 'timed';

const timingOptions: { value: TimingMode; label: string }[] = [
  { value: 'all_day', label: 'All day' },
  { value: 'timed', label: 'Set time' },
];

const WINDOW_START = dayjs().subtract(30, 'day').toDate();
const WINDOW_END = dayjs().add(90, 'day').toDate();
const WINDOW_START_DATE = dayjs(WINDOW_START).format('YYYY-MM-DD');
const WINDOW_END_DATE = dayjs(WINDOW_END).format('YYYY-MM-DD');

interface CalendarViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function CalendarView({ selectedDate, onSelectDate }: CalendarViewProps) {
  const { data: events = [] } = useCalendarEvents();
  const { data: deviceEvents = [] } = useDeviceCalendarEvents(WINDOW_START, WINDOW_END);
  const { data: actionDates = [] } = useActionTaskDates(WINDOW_START_DATE, WINDOW_END_DATE);
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [title, setTitle] = useState('');
  const [timing, setTiming] = useState<TimingMode>('all_day');
  const [time, setTime] = useState('');

  const displayEvents = useMemo(() => toDisplayEvents(events, deviceEvents), [events, deviceEvents]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, DisplayEvent[]> = {};
    for (const event of displayEvents) {
      const date = dayjs(event.startAt).format('YYYY-MM-DD');
      (map[date] ??= []).push(event);
    }
    return map;
  }, [displayEvents]);

  const markedDates = useMemo(
    () => buildMarkedDates(displayEvents, selectedDate, actionDates),
    [displayEvents, selectedDate, actionDates]
  );

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
          onDayPress={(day: DateData) => onSelectDate(day.dateString)}
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
                  {event.allDay ? 'All day' : dayjs(event.startAt).format('h:mm A')}
                  {event.source === 'device' ? ` · ${event.deviceCalendarTitle}` : ''}
                </Text>
              </View>
              {event.source === 'app' && (
                <Pressable onPress={() => deleteEvent.mutate(event.id)} hitSlop={8}>
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </Pressable>
              )}
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
    color: colors.onAccent,
    fontWeight: '600',
    fontSize: 16,
  },
});
