import { StyleSheet, Text, View } from 'react-native';
import type { HourlyStepBucket } from '../../../lib/healthkit';
import { spacing, workoutTheme } from '../../../lib/theme';

interface StepsHourlyChartProps {
  buckets: HourlyStepBucket[];
}

const CHART_HEIGHT = 100;

export function StepsHourlyChart({ buckets }: StepsHourlyChartProps) {
  if (buckets.length === 0) {
    return <Text style={[styles.empty]}>No hourly step data for this day.</Text>;
  }

  const byHour = new Map(buckets.map((b) => [b.hour, b.steps]));
  const hours = Array.from({ length: 24 }, (_, hour) => byHour.get(hour) ?? 0);
  const max = Math.max(...hours, 1);

  return (
    <View>
      <View style={styles.bars}>
        {hours.map((steps, hour) => (
          <View key={hour} style={styles.barTrack}>
            <View style={[styles.bar, { height: Math.max(2, (steps / max) * CHART_HEIGHT) }]} />
          </View>
        ))}
      </View>
      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>12 AM</Text>
        <Text style={styles.xLabel}>6 AM</Text>
        <Text style={styles.xLabel}>12 PM</Text>
        <Text style={styles.xLabel}>6 PM</Text>
        <Text style={styles.xLabel}>12 AM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT, gap: 2 },
  barTrack: { flex: 1, justifyContent: 'flex-end' },
  bar: { backgroundColor: workoutTheme.accent, borderRadius: 2 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  xLabel: { fontFamily: workoutTheme.fontMono, fontSize: 9, color: workoutTheme.textMuted },
  empty: { fontFamily: workoutTheme.fontSerif, fontStyle: 'italic', fontSize: 14, color: workoutTheme.textSecondary },
});
