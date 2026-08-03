import dayjs from 'dayjs';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { WeightTrendChart } from '../ui/WeightTrendChart';
import { useFirstWeightLog, useWeightLogs } from '../../hooks/useWeightLogs';
import { useProfile } from '../../hooks/useProfile';
import { formatWeight, kgToLb } from '../../lib/units';
import { spacing, typography, workoutTheme } from '../../lib/theme';

export function WeightTrendCard({ style }: { style?: ViewStyle }) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: logs = [] } = useWeightLogs(30);
  const { data: firstLog } = useFirstWeightLog();
  const unitsPreference = profile?.units_preference ?? 'imperial';
  const unitLabel = unitsPreference === 'metric' ? 'kg' : 'lb';
  const latest = logs[0] ?? null;
  const chronological = [...logs].reverse();

  const displayWeight = (kg: number) => (unitsPreference === 'metric' ? kg : kgToLb(kg));
  const deltaSinceStart =
    latest && firstLog && firstLog.date !== latest.date
      ? displayWeight(latest.weight_kg) - displayWeight(firstLog.weight_kg)
      : null;

  return (
    <Card onPress={() => router.push('/(tabs)/trackers')} style={style}>
      <Text style={typography.eyebrow}>Weight Graph</Text>
      {latest && (
        <Text style={styles.statValue}>
          {formatWeight(latest.weight_kg, unitsPreference)}
          <Text style={typography.caption}> {unitLabel}</Text>
        </Text>
      )}

      <View style={{ marginTop: spacing.sm }}>
        <WeightTrendChart logs={chronological} unitsPreference={unitsPreference} />
      </View>

      {deltaSinceStart != null && (
        <Text style={styles.deltaSubtitle}>
          {deltaSinceStart > 0 ? '+' : ''}
          {deltaSinceStart.toFixed(1)} {unitLabel} since you started ({dayjs(firstLog!.date).format('MMM D')})
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  statValue: { ...typography.statLarge, marginTop: spacing.xs },
  deltaSubtitle: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 13,
    color: workoutTheme.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
