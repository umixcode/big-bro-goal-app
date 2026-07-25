import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { useWeightLogs } from '../../hooks/useWeightLogs';
import { useProfile } from '../../hooks/useProfile';
import { formatWeight } from '../../lib/units';
import { colors, spacing, typography } from '../../lib/theme';

export function WeightTrendCard({ style }: { style?: ViewStyle }) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: logs = [] } = useWeightLogs(7);
  const unitsPreference = profile?.units_preference ?? 'imperial';
  const unitLabel = unitsPreference === 'metric' ? 'kg' : 'lb';
  const latest = logs[0] ?? null;
  const chronological = [...logs].reverse();
  const maxWeight = Math.max(...chronological.map((l) => l.weight_kg), 1);
  const minWeight = Math.min(...chronological.map((l) => l.weight_kg), maxWeight);
  const range = maxWeight - minWeight || 1;

  return (
    <Card onPress={() => router.push('/(tabs)/trackers')} style={style}>
      <Text style={typography.heading}>Weight Graph</Text>
      {chronological.length > 1 ? (
        <View style={styles.sparkline}>
          {chronological.map((log) => {
            const heightPct = ((log.weight_kg - minWeight) / range) * 0.8 + 0.2;
            return <View key={log.id} style={[styles.bar, { height: `${heightPct * 100}%` }]} />;
          })}
        </View>
      ) : (
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>Log weight to see your trend</Text>
      )}
      <Text style={[typography.caption, { marginTop: spacing.sm }]}>
        {latest ? `Latest: ${formatWeight(latest.weight_kg, unitsPreference)} ${unitLabel}` : ''}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  sparkline: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40, marginTop: spacing.sm },
  bar: { flex: 1, backgroundColor: colors.accent, borderRadius: 2, minHeight: 4 },
});
