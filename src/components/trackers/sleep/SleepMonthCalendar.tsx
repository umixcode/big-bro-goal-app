import { useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useSleepMonth } from '../../../hooks/useSleepLogs';
import { radii, spacing, typography, workoutTheme } from '../../../lib/theme';

interface SleepMonthCalendarProps {
  sleepGoalHours: number;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function SleepMonthCalendar({ sleepGoalHours, selectedDate, onSelectDate }: SleepMonthCalendarProps) {
  const [monthKey, setMonthKey] = useState(dayjs().format('YYYY-MM'));
  const { statusByDate } = useSleepMonth(monthKey, sleepGoalHours);
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <View>
      <Calendar
        current={`${monthKey}-01`}
        onMonthChange={(date: DateData) => setMonthKey(date.dateString.slice(0, 7))}
        enableSwipeMonths
        theme={calendarTheme}
        style={styles.calendar}
        dayComponent={({ date }: { date?: DateData }) => {
          if (!date) return <View style={styles.dayCell} />;
          const inMonth = date.dateString.slice(0, 7) === monthKey;
          const status = statusByDate.get(date.dateString);
          const isSelected = date.dateString === selectedDate;
          const isFuture = date.dateString > today;

          const fill = status === 'met' ? workoutTheme.accent : 'transparent';
          const borderColor =
            status === 'met' ? null : status === 'partial' ? workoutTheme.accent : workoutTheme.border;
          const textColor = status === 'met' ? workoutTheme.background : workoutTheme.textSecondary;

          return (
            <Pressable
              style={styles.dayCell}
              disabled={!inMonth || isFuture}
              onPress={() => onSelectDate(date.dateString)}
            >
              <View
                style={[
                  styles.dayCircle,
                  { backgroundColor: fill },
                  borderColor != null && { borderWidth: status === 'partial' ? 2 : 1, borderColor },
                  isSelected && styles.dayCircleSelected,
                ]}
              >
                <Text style={[styles.dayNumber, { color: inMonth ? textColor : workoutTheme.border }]}>
                  {date.day}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <Ionicons name="checkmark-circle" size={14} color={workoutTheme.accent} />
          <Text style={typography.caption}>Goal met</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderWidth: 2, borderColor: workoutTheme.accent }]} />
          <Text style={typography.caption}>Partial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderWidth: 1, borderColor: workoutTheme.border }]} />
          <Text style={typography.caption}>No data</Text>
        </View>
      </View>
    </View>
  );
}

const calendarTheme = {
  backgroundColor: workoutTheme.background,
  calendarBackground: workoutTheme.background,
  textSectionTitleColor: workoutTheme.textMuted,
  monthTextColor: workoutTheme.textPrimary,
  arrowColor: workoutTheme.accent,
  textMonthFontFamily: workoutTheme.fontSerif,
  textMonthFontSize: 18,
  textMonthFontWeight: '700' as const,
  textDayHeaderFontFamily: workoutTheme.fontMono,
  textDayHeaderFontSize: 10,
};

const styles = StyleSheet.create({
  calendar: { backgroundColor: workoutTheme.background },
  dayCell: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    borderWidth: 2,
    borderColor: workoutTheme.textPrimary,
  },
  dayNumber: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: radii.full },
});
