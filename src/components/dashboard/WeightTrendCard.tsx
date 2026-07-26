import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { GradientAreaChart } from '../ui/GradientAreaChart';
import { useWeightLogs } from '../../hooks/useWeightLogs';
import { useProfile } from '../../hooks/useProfile';
import { formatWeight } from '../../lib/units';
import { spacing, typography } from '../../lib/theme';

export function WeightTrendCard({ style }: { style?: ViewStyle }) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: logs = [] } = useWeightLogs(7);
  const unitsPreference = profile?.units_preference ?? 'imperial';
  const unitLabel = unitsPreference === 'metric' ? 'kg' : 'lb';
  const latest = logs[0] ?? null;
  const chronological = [...logs].reverse();

  return (
    <Card onPress={() => router.push('/(tabs)/trackers')} style={style}>
      <Text style={typography.eyebrow}>Weight Graph</Text>
      {latest && (
        <Text style={styles.statValue}>
          {formatWeight(latest.weight_kg, unitsPreference)}
          <Text style={typography.caption}> {unitLabel}</Text>
        </Text>
      )}
      {chronological.length > 1 ? (
        <GradientAreaChart
          values={chronological.map((l) => l.weight_kg)}
          height={56}
          style={{ marginTop: spacing.sm }}
        />
      ) : (
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>Log weight to see your trend</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  statValue: { ...typography.statLarge, marginTop: spacing.xs },
});
