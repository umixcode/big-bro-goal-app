import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseTrendChart } from '../../../../src/components/workout/ExerciseTrendChart';
import { useExerciseHistory } from '../../../../src/hooks/useExerciseHistory';
import { useProfile } from '../../../../src/hooks/useProfile';
import { kgToLb } from '../../../../src/lib/units';
import { spacing, workoutTheme } from '../../../../src/lib/theme';
import { pickBestSession, type SessionHistoryEntry } from '../../../../src/lib/workoutStats';

const RANGES = [
  { key: 'W', label: 'W', unit: 'week' as const, amount: 1, subtitle: 'this week' },
  { key: 'M', label: 'M', unit: 'month' as const, amount: 1, subtitle: 'this month' },
  { key: '3M', label: '3M', unit: 'month' as const, amount: 3, subtitle: 'past 3 months' },
  { key: '6M', label: '6M', unit: 'month' as const, amount: 6, subtitle: 'past 6 months' },
  { key: 'Y', label: 'Y', unit: 'year' as const, amount: 1, subtitle: 'this year' },
  { key: 'ALL', label: 'All', unit: null, amount: 0, subtitle: 'all time' },
];

export default function ExerciseHistoryScreen() {
  const router = useRouter();
  const { exerciseName } = useLocalSearchParams<{ exerciseName: string }>();
  const { data: profile } = useProfile();
  const { data: sessions = [] } = useExerciseHistory(exerciseName);
  const insets = useSafeAreaInsets();
  const [rangeKey, setRangeKey] = useState('ALL');

  const unitsPreference = profile?.units_preference ?? 'imperial';
  const unitLabel = unitsPreference === 'metric' ? 'kg' : 'lb';
  const displayWeight = (kg: number) => (unitsPreference === 'metric' ? kg : kgToLb(kg));

  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[RANGES.length - 1];

  const filteredSessions = useMemo(() => {
    if (!range.unit) return sessions;
    const cutoff = dayjs().subtract(range.amount, range.unit).format('YYYY-MM-DD');
    return sessions.filter((s) => s.date >= cutoff);
  }, [sessions, range]);

  const latest: SessionHistoryEntry | undefined = filteredSessions[filteredSessions.length - 1];
  const bestSession = pickBestSession(filteredSessions);
  const bestWeightKg = bestSession?.topWeightKg ?? null;

  const deltaKg =
    filteredSessions.length >= 2
      ? filteredSessions[filteredSessions.length - 1].topWeightKg - filteredSessions[0].topWeightKg
      : 0;

  const last30CutoffDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const priorTo30Days = [...sessions].reverse().find((s) => s.date < last30CutoffDate);
  const last30DeltaKg = latest ? latest.topWeightKg - (priorTo30Days?.topWeightKg ?? sessions[0]?.topWeightKg ?? latest.topWeightKg) : 0;

  const formatDelta = (kg: number) => {
    const value = displayWeight(kg);
    const sign = value > 0 ? '+' : value < 0 ? '' : '+';
    return `${sign}${value.toFixed(1)}`;
  };

  const onLogSession = () => router.back();

  return (
    <ScrollView
      style={{ backgroundColor: workoutTheme.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>history</Text>
          <Text style={styles.title}>{exerciseName}</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={22} color={workoutTheme.textMuted} />
        </Pressable>
      </View>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <Pressable
            key={r.key}
            style={[styles.rangePill, rangeKey === r.key && styles.rangePillActive]}
            onPress={() => setRangeKey(r.key)}
          >
            <Text style={[styles.rangePillText, rangeKey === r.key && styles.rangePillTextActive]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <ExerciseTrendChart sessions={filteredSessions} unitsPreference={unitsPreference} />

      {filteredSessions.length > 0 && (
        <Text style={styles.deltaSubtitle}>
          {formatDelta(deltaKg)} {unitLabel} · {range.subtitle}
        </Text>
      )}

      {latest && (
        <>
          <View style={styles.divider} />
          <View style={styles.latestRow}>
            <Text style={styles.latestDate}>{dayjs(latest.date).format('MMM D')}</Text>
            <View style={styles.repPills}>
              {latest.sets.map((set, i) => (
                <View key={i} style={styles.repPill}>
                  <Text style={styles.repPillText}>{set.reps}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.totalReps}>
              {latest.sets.reduce((sum, s) => sum + s.reps, 0)} reps
            </Text>
          </View>
        </>
      )}

      <View style={styles.divider} />
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>sessions</Text>
          <Text style={styles.statValue}>{filteredSessions.length}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>last 30 days</Text>
          <Text style={[styles.statValue, styles.statValueAccent]}>
            {formatDelta(last30DeltaKg)} {unitLabel}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>best</Text>
          <Text style={[styles.statValue, styles.statValueGold]}>
            {bestWeightKg != null ? `${displayWeight(bestWeightKg).toFixed(1)} ${unitLabel}` : '—'}
          </Text>
        </View>
      </View>

      {filteredSessions.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDate]}>date</Text>
            <Text style={[styles.tableHeaderText, styles.colSets]}>sets</Text>
            <Text style={[styles.tableHeaderText, styles.colReps]}>reps</Text>
            <Text style={[styles.tableHeaderText, styles.colWeight]}>weight</Text>
            <Text style={[styles.tableHeaderText, styles.colProgress]}>progress</Text>
          </View>
          {[...filteredSessions].reverse().map((session, i, arr) => {
            const previous = arr[i + 1];
            const progressKg = previous ? session.topWeightKg - previous.topWeightKg : 0;
            const isBest = bestSession != null && session.date === bestSession.date;
            return (
              <View key={session.date} style={styles.tableRow}>
                <Text style={[styles.tableCellDate, styles.colDate]}>{dayjs(session.date).format('MMM D')}</Text>
                <Text style={[styles.tableCell, styles.colSets]}>{session.sets.length}</Text>
                <Text style={[styles.tableCell, styles.colReps]}>{session.topReps}</Text>
                <View style={styles.colWeight}>
                  <Text style={[styles.tableCell, isBest && styles.tableCellGold]}>
                    {isBest ? '★ ' : ''}
                    {displayWeight(session.topWeightKg).toFixed(1)} {unitLabel}
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.colProgress]}>{formatDelta(progressKg)}</Text>
              </View>
            );
          })}
        </>
      )}

      <Pressable style={styles.logButton} onPress={onLogSession}>
        <Text style={styles.logButtonText}>+ log a session</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: workoutTheme.background,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 14,
    color: workoutTheme.textMuted,
  },
  title: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 32,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    marginTop: 2,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  rangePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  rangePillActive: {
    backgroundColor: workoutTheme.accent,
  },
  rangePillText: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: workoutTheme.textMuted,
  },
  rangePillTextActive: {
    color: workoutTheme.background,
  },
  deltaSubtitle: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 14,
    color: workoutTheme.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: workoutTheme.border,
    marginVertical: spacing.md,
  },
  latestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  latestDate: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 15,
    color: workoutTheme.textSecondary,
  },
  repPills: { flexDirection: 'row', gap: spacing.xs, flex: 1 },
  repPill: {
    borderWidth: 1,
    borderColor: workoutTheme.accentMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  repPillText: {
    fontFamily: workoutTheme.fontSerif,
    fontWeight: '700',
    fontSize: 15,
    color: workoutTheme.textPrimary,
  },
  totalReps: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 12,
    letterSpacing: 0.5,
    color: workoutTheme.accent,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 18,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
  },
  statValueAccent: { color: workoutTheme.accent, fontStyle: 'italic' },
  statValueGold: { color: workoutTheme.warning, fontStyle: 'italic' },
  tableHeader: { flexDirection: 'row', marginBottom: spacing.sm },
  tableHeaderText: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: workoutTheme.surfaceRaised,
  },
  tableCell: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 14,
    color: workoutTheme.textPrimary,
  },
  tableCellDate: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 14,
    color: workoutTheme.textSecondary,
  },
  tableCellGold: { color: workoutTheme.warning },
  colDate: { flex: 1.2 },
  colSets: { flex: 0.7 },
  colReps: { flex: 0.7 },
  colWeight: { flex: 1.6 },
  colProgress: { flex: 1 },
  logButton: {
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderStyle: 'dashed',
    borderRadius: 9999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  logButtonText: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 15,
    color: workoutTheme.textSecondary,
  },
});
