import { useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CircularProgressRing } from '../../../src/components/ui/CircularProgressRing';
import { SleepStagesChart } from '../../../src/components/trackers/sleep/SleepStagesChart';
import { SleepMonthCalendar } from '../../../src/components/trackers/sleep/SleepMonthCalendar';
import { useSleepLog } from '../../../src/hooks/useSleepLogs';
import { useDailyTargets } from '../../../src/hooks/useDailyTargets';
import { useHealthKitSync } from '../../../src/hooks/useHealthKitSync';
import { calculateSleepScore, getSleepStatus } from '../../../src/lib/formulas';
import { formatDurationHM } from '../../../src/lib/units';
import { colors, radii, spacing, typography, workoutTheme } from '../../../src/lib/theme';

export default function SleepDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(today);

  const { targets } = useDailyTargets();
  const sleepGoalHours = targets?.sleepGoalHours ?? 8;
  const { data: log } = useSleepLog(selectedDate);
  useHealthKitSync();

  const totalMinutes = log?.total_minutes ?? 0;
  const progress = sleepGoalHours > 0 ? totalMinutes / (sleepGoalHours * 60) : 0;
  const score = calculateSleepScore(totalMinutes, sleepGoalHours);
  const status = getSleepStatus(score);
  const hasLog = log != null && totalMinutes > 0;

  const dateLabel = selectedDate === today ? 'Last night' : dayjs(selectedDate).format('dddd, MMM D');

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
          <Text style={styles.eyebrow}>sleep</Text>
          <Text style={styles.title}>{dateLabel}</Text>
        </View>
      </View>

      {hasLog ? (
        <>
          <View style={styles.card}>
            <View style={styles.scoreRow}>
              <CircularProgressRing progress={progress} size={116} strokeWidth={12}>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={typography.caption}>score</Text>
              </CircularProgressRing>
              <View style={styles.scoreText}>
                <Text style={styles.statusLabel}>{status.label}</Text>
                <Text style={[typography.caption, styles.statusMessage]}>{status.message}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.quickStatsRow}>
              <QuickStat
                icon="moon"
                label="Bedtime"
                value={log.start_time ? dayjs(log.start_time).format('h:mm A') : '—'}
              />
              <QuickStat
                icon="sunny"
                label="Wake up"
                value={log.end_time ? dayjs(log.end_time).format('h:mm A') : '—'}
              />
              <QuickStat icon="time" label="Time asleep" value={formatDurationHM(totalMinutes)} />
            </View>
          </View>

          <View style={styles.statGrid}>
            <StatTile label="Duration" value={formatDurationHM(totalMinutes)} />
            <StatTile label="Deep sleep" value={formatDurationHM(log.deep_minutes ?? 0)} />
            <StatTile label="Goal" value={`${sleepGoalHours}h`} />
            <StatTile label="Source" value={log.source === 'healthkit' ? 'Apple Health' : 'Manual'} />
          </View>

          <View style={styles.card}>
            <Text style={typography.heading}>Sleep Stages</Text>
            <View style={{ marginTop: spacing.md }}>
              <SleepStagesChart
                segments={log.stage_segments}
                startTime={log.start_time}
                endTime={log.end_time}
                deepMinutes={log.deep_minutes}
                lightMinutes={log.light_minutes}
                remMinutes={log.rem_minutes}
                awakeMinutes={log.awake_minutes}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={typography.heading}>Sleep Quality</Text>
            {log.avg_heart_rate_bpm == null && log.avg_hrv_ms == null && log.avg_respiratory_rate == null ? (
              <Text style={[typography.caption, { marginTop: spacing.sm }]}>
                No heart rate, HRV, or breathing data for this night — Apple Watch is needed for these signals.
              </Text>
            ) : (
              <View style={[styles.statGrid, { marginTop: spacing.md }]}>
                {log.avg_heart_rate_bpm != null && (
                  <QualityTile icon="heart" label="Avg. heart rate" value={`${Math.round(log.avg_heart_rate_bpm)} bpm`} />
                )}
                {log.avg_hrv_ms != null && (
                  <QualityTile icon="pulse" label="HRV" value={`${Math.round(log.avg_hrv_ms)} ms`} />
                )}
                {log.avg_respiratory_rate != null && (
                  <QualityTile icon="fitness" label="Breathing" value={`${log.avg_respiratory_rate.toFixed(1)} br/min`} />
                )}
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Ionicons name="moon-outline" size={24} color={workoutTheme.textMuted} />
          <Text style={[typography.body, { marginTop: spacing.sm }]}>No sleep data for this night yet.</Text>
          <Text style={[typography.caption, { marginTop: spacing.xs }]}>
            Sleep synced from Apple Health shows up here automatically.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={typography.heading}>Consistency</Text>
        <View style={{ marginTop: spacing.sm }}>
          <SleepMonthCalendar
            sleepGoalHours={sleepGoalHours}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function QuickStat({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
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

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

function QualityTile({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon} size={16} color={workoutTheme.accent} />
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scoreValue: { fontFamily: workoutTheme.fontSerif, fontSize: 32, fontWeight: '700', color: colors.textPrimary },
  scoreText: { flex: 1, gap: spacing.xs },
  statusLabel: { ...typography.heading },
  statusMessage: { lineHeight: 18 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  quickStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickStat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  quickStatValue: { ...typography.body, fontWeight: '600' },
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
