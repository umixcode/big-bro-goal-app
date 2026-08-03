import { StyleSheet, Text, View } from 'react-native';
import { spacing, workoutTheme } from '../../lib/theme';
import type { WorkoutPhaseDay } from '../../api/workoutPrograms';

interface DayProgressHeaderProps {
  dayName: string;
  days: WorkoutPhaseDay[];
  currentDayId: string;
  completedDayIds: Set<string>;
  loggedCount: number;
  totalCount: number;
}

export function DayProgressHeader({
  dayName,
  days,
  currentDayId,
  completedDayIds,
  loggedCount,
  totalCount,
}: DayProgressHeaderProps) {
  return (
    <View>
      <Text style={styles.title}>{dayName}</Text>

      <View style={styles.tabs}>
        {days.map((day) => {
          const isCurrent = day.id === currentDayId;
          const isComplete = completedDayIds.has(day.id);
          const lineStyle = isComplete
            ? styles.tabLineComplete
            : isCurrent
              ? styles.tabLineActive
              : styles.tabLineInactive;
          return (
            <View key={day.id} style={styles.tab}>
              <View style={[styles.tabLine, lineStyle]} />
              <Text style={[styles.tabLabel, (isCurrent || isComplete) && styles.tabLabelActive]}>
                {day.day_name}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: totalCount > 0 ? `${Math.min(100, (loggedCount / totalCount) * 100)}%` : '0%' },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {loggedCount} <Text style={styles.progressLabelItalic}>of {totalCount} logged</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 40,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tab: { flex: 1 },
  tabLine: {
    height: 2,
    borderTopWidth: 2,
    marginBottom: spacing.sm,
  },
  tabLineComplete: {
    borderTopColor: workoutTheme.accent,
    borderStyle: 'solid',
  },
  tabLineActive: {
    borderTopColor: workoutTheme.accent,
    borderStyle: 'dotted',
  },
  tabLineInactive: {
    borderTopColor: workoutTheme.border,
    borderStyle: 'solid',
  },
  tabLabel: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
  },
  tabLabelActive: {
    color: workoutTheme.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 1,
    backgroundColor: workoutTheme.border,
    borderRadius: 1,
  },
  progressFill: {
    height: 1,
    backgroundColor: workoutTheme.accent,
    borderRadius: 1,
  },
  progressLabel: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 16,
    color: workoutTheme.textPrimary,
  },
  progressLabelItalic: {
    fontStyle: 'italic',
    color: workoutTheme.textSecondary,
  },
});
