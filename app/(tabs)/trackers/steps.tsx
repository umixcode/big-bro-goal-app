import { useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CircularProgressRing } from '../../../src/components/ui/CircularProgressRing';
import { StepsHourlyChart } from '../../../src/components/trackers/steps/StepsHourlyChart';
import { HeartRateChart } from '../../../src/components/trackers/steps/HeartRateChart';
import { RouteMapChart } from '../../../src/components/trackers/steps/RouteMapChart';
import { MiniSparkline } from '../../../src/components/trackers/steps/MiniSparkline';
import { useStepsLog, useStepsWeek } from '../../../src/hooks/useStepsLogs';
import type { StepsLog } from '../../../src/api/stepsLogs';
import { useHourlyStepBreakdown, useHeartRateSamples, useRouteWorkouts } from '../../../src/hooks/useStepsDetail';
import { useDailyTargets } from '../../../src/hooks/useDailyTargets';
import { useProfile } from '../../../src/hooks/useProfile';
import { useHealthKitSync } from '../../../src/hooks/useHealthKitSync';
import { getStepsStatusMessage } from '../../../src/lib/formulas';
import { formatDistance, formatDurationHM } from '../../../src/lib/units';
import { colors, radii, sleepStageColors, spacing, typography, workoutTheme } from '../../../src/lib/theme';

function formatDelta(percent: number | null): string {
  if (percent == null) return '—';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(0)}%`;
}

export default function StepsDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(today);

  const { targets } = useDailyTargets();
  const stepGoal = targets?.stepGoal ?? 10000;
  const { data: profile } = useProfile();
  const unitsPreference = profile?.units_preference ?? 'imperial';

  const { data: log } = useStepsLog(selectedDate);
  const { days: weekDays, byDate: weekByDate } = useStepsWeek(stepGoal);
  const { data: hourlyBuckets = [] } = useHourlyStepBreakdown(selectedDate);
  const { data: heartRateSamples = [] } = useHeartRateSamples(selectedDate);
  const { data: routeWorkouts = [] } = useRouteWorkouts(selectedDate);
  useHealthKitSync();

  const steps = log?.steps ?? 0;
  const progress = stepGoal > 0 ? steps / stepGoal : 0;
  const weeklyAvgSteps = weekDays.length > 0 ? weekDays.reduce((sum, d) => sum + (d.log?.steps ?? 0), 0) / weekDays.length : 0;
  const statusMessage = getStepsStatusMessage(steps, stepGoal, weeklyAvgSteps);

  const dateLabel = selectedDate === today ? 'Today' : dayjs(selectedDate).format('dddd, MMM D');

  const previousDate = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
  const previousLog = weekByDate.get(previousDate) ?? null;

  const percentDelta = (current: number, previous: number | null | undefined): number | null => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  };

  const sparklineFor = (pick: (log: StepsLog) => number | null) =>
    weekDays.map((d) => (d.log ? (pick(d.log) ?? 0) : 0));

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={workoutTheme.textSecondary} />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>steps</Text>
          <Text style={styles.title}>{dateLabel}</Text>
        </View>
      </View>

      <View style={styles.dayStrip}>
        {weekDays.map((day) => {
          const isSelected = day.date === selectedDate;
          const isFuture = day.date > today;
          return (
            <Pressable
              key={day.date}
              disabled={isFuture}
              onPress={() => setSelectedDate(day.date)}
              style={[styles.dayPill, isSelected && styles.dayPillSelected]}
            >
              <Text style={[styles.dayPillWeekday, isSelected && styles.dayPillTextSelected]}>
                {dayjs(day.date).format('ddd')}
              </Text>
              <Text style={[styles.dayPillNumber, isSelected && styles.dayPillTextSelected]}>
                {dayjs(day.date).format('D')}
              </Text>
              {day.met && <View style={[styles.dayPillDot, isSelected && styles.dayPillDotSelected]} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <View style={styles.scoreRow}>
          <CircularProgressRing progress={progress} size={116} strokeWidth={12}>
            <Ionicons name="footsteps" size={18} color={workoutTheme.accent} />
            <Text style={styles.scoreValue}>{steps.toLocaleString()}</Text>
            <Text style={typography.caption}>steps</Text>
          </CircularProgressRing>
          <View style={styles.scoreText}>
            <Text style={styles.statusLabel}>{Math.round(progress * 100)}% of goal</Text>
            <Text style={[typography.caption, styles.statusMessage]}>{statusMessage}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.quickStatsRow}>
          <QuickStat icon="navigate" label="Distance" value={formatDistance(log?.distance_m ?? 0, unitsPreference)} />
          <QuickStat icon="flame" label="Calories" value={`${Math.round(log?.active_calories ?? 0)} kcal`} />
          <QuickStat icon="time" label="Active Time" value={formatDurationHM(log?.active_minutes ?? 0)} />
          <QuickStat icon="layers" label="Floors" value={`${log?.floors_climbed ?? 0}`} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={typography.heading}>Steps Overview</Text>
          <Text style={styles.deltaText}>{formatDelta(percentDelta(steps, previousLog?.steps))} vs previous day</Text>
        </View>
        <Text style={styles.overviewTotal}>{steps.toLocaleString()} steps</Text>
        <View style={{ marginTop: spacing.md }}>
          <StepsHourlyChart buckets={hourlyBuckets} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="heart" size={16} color={workoutTheme.danger} />
          <Text style={[typography.heading, { marginLeft: spacing.xs }]}>Heart Rate</Text>
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <HeartRateChart samples={heartRateSamples} />
        </View>
      </View>

      {routeWorkouts.length > 0 ? (
        routeWorkouts.map((workout) => (
          <View key={workout.startDate} style={styles.card}>
            <RouteMapChart workout={workout} unitsPreference={unitsPreference} />
          </View>
        ))
      ) : (
        <View style={styles.card}>
          <Text style={typography.heading}>Route</Text>
          <Text style={[typography.caption, { marginTop: spacing.sm }]}>
            No outdoor walk or run recorded for this day.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={typography.heading}>Activity Summary</Text>
        <View style={[styles.statGrid, { marginTop: spacing.md }]}>
          <ActivityTile
            label="Steps"
            value={steps.toLocaleString()}
            delta={percentDelta(steps, previousLog?.steps)}
            sparkline={sparklineFor((l) => l.steps)}
            color={workoutTheme.accent}
          />
          <ActivityTile
            label="Distance"
            value={formatDistance(log?.distance_m ?? 0, unitsPreference)}
            delta={percentDelta(log?.distance_m ?? 0, previousLog?.distance_m)}
            sparkline={sparklineFor((l) => l.distance_m)}
            color={sleepStageColors.deep}
          />
          <ActivityTile
            label="Calories"
            value={`${Math.round(log?.active_calories ?? 0)} kcal`}
            delta={percentDelta(log?.active_calories ?? 0, previousLog?.active_calories)}
            sparkline={sparklineFor((l) => l.active_calories)}
            color={workoutTheme.warning}
          />
          <ActivityTile
            label="Active Time"
            value={formatDurationHM(log?.active_minutes ?? 0)}
            delta={percentDelta(log?.active_minutes ?? 0, previousLog?.active_minutes)}
            sparkline={sparklineFor((l) => l.active_minutes)}
            color={sleepStageColors.rem}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.quickStat}>
      <Ionicons name={icon} size={16} color={workoutTheme.accent} />
      <View>
        <Text style={styles.quickStatValue}>{value}</Text>
        <Text style={typography.caption}>{label}</Text>
      </View>
    </View>
  );
}

function ActivityTile({
  label,
  value,
  delta,
  sparkline,
  color,
}: {
  label: string;
  value: string;
  delta: number | null;
  sparkline: number[];
  color: string;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={[styles.deltaText, delta != null && delta >= 0 ? styles.deltaUp : styles.deltaDown]}>
        {formatDelta(delta)}
      </Text>
      <MiniSparkline values={sparkline} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 13,
    color: workoutTheme.textMuted,
  },
  title: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 26,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
  },
  dayStrip: { flexDirection: 'row', justifyContent: 'space-between' },
  dayPill: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.md,
    minWidth: 38,
  },
  dayPillSelected: { backgroundColor: colors.surface, borderWidth: 1, borderColor: workoutTheme.accent },
  dayPillWeekday: { ...typography.caption, fontSize: 10 },
  dayPillNumber: { ...typography.body, fontWeight: '600' },
  dayPillTextSelected: { color: workoutTheme.accent },
  dayPillDot: { width: 4, height: 4, borderRadius: radii.full, backgroundColor: workoutTheme.textMuted },
  dayPillDotSelected: { backgroundColor: workoutTheme.accent },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scoreValue: { fontFamily: workoutTheme.fontSerif, fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  scoreText: { flex: 1, gap: spacing.xs },
  statusLabel: { ...typography.heading },
  statusMessage: { lineHeight: 18 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  quickStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickStat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexBasis: '45%' },
  quickStatValue: { ...typography.body, fontWeight: '600' },
  overviewTotal: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 22,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    marginTop: spacing.xs,
  },
  deltaText: { ...typography.caption },
  deltaUp: { color: workoutTheme.accent },
  deltaDown: { color: workoutTheme.danger },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statTileValue: { ...typography.heading, fontSize: 18 },
});
