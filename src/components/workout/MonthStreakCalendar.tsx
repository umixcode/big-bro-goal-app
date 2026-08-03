import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useMonthSummary } from '../../hooks/useWorkoutSession';
import { spacing, workoutTheme } from '../../lib/theme';
import { getDayVisual } from '../../lib/workoutStatusColors';

interface MonthStreakCalendarProps {
  signupDate?: string | null;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export function MonthStreakCalendar({ signupDate, selectedDate, onSelectDate }: MonthStreakCalendarProps) {
  const [monthKey, setMonthKey] = useState(dayjs().format('YYYY-MM'));
  const { data: days = [] } = useMonthSummary(monthKey);
  const today = dayjs().format('YYYY-MM-DD');
  const signupDateOnly = signupDate ? dayjs(signupDate).format('YYYY-MM-DD') : null;

  const statusByDate = useMemo(() => new Map(days.map((d) => [d.date, d.status])), [days]);

  return (
    <View style={styles.card}>
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
          const isSelected = date.dateString === (selectedDate ?? today);

          if (!inMonth || !status) {
            return (
              <View style={styles.dayCell}>
                <View style={styles.dayCircle}>
                  <Text style={[styles.dayNumber, { color: workoutTheme.border }]}>{date.day}</Text>
                </View>
              </View>
            );
          }

          const visual = getDayVisual(status, {
            isPast: date.dateString < today,
            isBeforeSignup: signupDateOnly != null && date.dateString < signupDateOnly,
          });
          const textColor = status === 'complete' ? workoutTheme.background : workoutTheme.textSecondary;

          return (
            <Pressable style={styles.dayCell} onPress={() => onSelectDate?.(date.dateString)}>
              <View
                style={[
                  styles.dayCircle,
                  { backgroundColor: visual.fill },
                  visual.borderColor != null && { borderWidth: 2, borderColor: visual.borderColor },
                  isSelected && styles.dayCircleSelected,
                ]}
              >
                {visual.showX ? (
                  <Ionicons name="close" size={14} color={workoutTheme.danger} />
                ) : (
                  <Text style={[styles.dayNumber, { color: textColor }]}>{date.day}</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
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
  card: {
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 16,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  calendar: { backgroundColor: workoutTheme.background },
  dayCell: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 9999,
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
});
