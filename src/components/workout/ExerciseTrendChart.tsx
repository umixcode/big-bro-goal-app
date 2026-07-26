import dayjs from 'dayjs';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkline } from '../ui/Sparkline';
import { kgToLb } from '../../lib/units';
import { colors, spacing, typography } from '../../lib/theme';

interface ExerciseTrendChartProps {
  history: { date: string; weightKg: number }[];
  unitsPreference: 'metric' | 'imperial';
}

export function ExerciseTrendChart({ history, unitsPreference }: ExerciseTrendChartProps) {
  const unitLabel = unitsPreference === 'metric' ? 'kg' : 'lb';
  const displayWeight = (kg: number) => (unitsPreference === 'metric' ? kg : kgToLb(kg));

  if (history.length === 0) {
    return <Text style={typography.caption}>No sets logged yet for this exercise.</Text>;
  }

  const chronological = [...history];
  const mostRecentFirst = [...history].reverse();

  return (
    <View>
      {chronological.length > 1 && (
        <Sparkline values={chronological.map((h) => displayWeight(h.weightKg))} style={styles.sparkline} />
      )}
      {mostRecentFirst.map((entry) => (
        <View key={entry.date} style={styles.row}>
          <Text style={typography.body}>{dayjs(entry.date).format('MMM D, YYYY')}</Text>
          <Text style={typography.body}>
            {displayWeight(entry.weightKg).toFixed(1)} {unitLabel}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sparkline: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
});
