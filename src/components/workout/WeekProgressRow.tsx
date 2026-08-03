import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, workoutTheme } from '../../lib/theme';
import { getDayVisual } from '../../lib/workoutStatusColors';
import type { DaySummary } from '../../api/workoutSessions';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface WeekProgressRowProps {
  days: DaySummary[];
  signupDate?: string | null;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  expanded?: boolean;
  onToggleMonth?: () => void;
}

export function WeekProgressRow({
  days,
  signupDate,
  selectedDate,
  onSelectDate,
  expanded,
  onToggleMonth,
}: WeekProgressRowProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const signupDateOnly = signupDate ? dayjs(signupDate).format('YYYY-MM-DD') : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {days.map((day, i) => {
          const isToday = day.date === today;
          const isSelected = day.date === (selectedDate ?? today);
          const visual = getDayVisual(day.status, {
            isPast: day.date < today,
            isBeforeSignup: signupDateOnly != null && day.date < signupDateOnly,
          });
          return (
            <Pressable
              key={day.date}
              style={styles.dayColumn}
              onPress={() => onSelectDate?.(day.date)}
              hitSlop={4}
            >
              <View
                style={[
                  styles.circle,
                  { backgroundColor: visual.fill },
                  visual.borderColor != null && { borderWidth: 2, borderColor: visual.borderColor },
                  isSelected && styles.circleSelected,
                ]}
              >
                {visual.showX && <Ionicons name="close" size={14} color={workoutTheme.danger} />}
              </View>
              <Text style={[styles.label, isToday && styles.labelToday]}>{DAY_LETTERS[i]}</Text>
            </Pressable>
          );
        })}
      </View>
      {onToggleMonth && (
        <Pressable onPress={onToggleMonth} style={styles.toggleRow}>
          <Text style={styles.toggleText}>{expanded ? 'hide month' : 'view month'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={workoutTheme.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: { alignItems: 'center', gap: spacing.xs },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: {
    borderWidth: 2,
    borderColor: workoutTheme.textPrimary,
  },
  label: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: workoutTheme.textMuted,
  },
  labelToday: {
    color: workoutTheme.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  toggleText: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 12,
    color: workoutTheme.textMuted,
  },
});
