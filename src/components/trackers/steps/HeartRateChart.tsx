import { useState } from 'react';
import dayjs from 'dayjs';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { HeartRateSample } from '../../../lib/healthkit';
import { spacing, workoutTheme } from '../../../lib/theme';

interface HeartRateChartProps {
  samples: HeartRateSample[];
}

const CHART_HEIGHT = 100;

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export function HeartRateChart({ samples }: HeartRateChartProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  if (samples.length === 0) {
    return <Text style={styles.empty}>No heart rate data for this day.</Text>;
  }

  const values = samples.map((s) => s.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const latest = values[values.length - 1];

  const dayStart = dayjs(samples[0].date).startOf('day').valueOf();
  const daySpan = 24 * 60 * 60 * 1000;
  const yFor = (v: number) => CHART_HEIGHT - ((v - min) / range) * CHART_HEIGHT;
  const xFor = (iso: string) => ((dayjs(iso).valueOf() - dayStart) / daySpan) * width;

  let chart = null;
  if (width > 0) {
    const points = samples.map((s) => ({ x: xFor(s.date), y: yFor(s.value) }));
    const linePath = buildLinePath(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

    chart = (
      <Svg width={width} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="heartRateFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={workoutTheme.danger} stopOpacity={0.3} />
            <Stop offset="1" stopColor={workoutTheme.danger} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#heartRateFill)" stroke="none" />
        <Path d={linePath} fill="none" stroke={workoutTheme.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.latest}>{latest} bpm</Text>
        <Text style={styles.avg}>avg {avg} bpm</Text>
      </View>
      <View style={{ height: CHART_HEIGHT }} onLayout={onLayout}>
        {chart}
      </View>
      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>12 AM</Text>
        <Text style={styles.xLabel}>12 PM</Text>
        <Text style={styles.xLabel}>11:59 PM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.sm },
  latest: { fontFamily: workoutTheme.fontSerif, fontSize: 20, fontWeight: '700', color: workoutTheme.textPrimary },
  avg: { fontFamily: workoutTheme.fontMono, fontSize: 12, color: workoutTheme.textMuted },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  xLabel: { fontFamily: workoutTheme.fontMono, fontSize: 9, color: workoutTheme.textMuted },
  empty: { fontFamily: workoutTheme.fontSerif, fontStyle: 'italic', fontSize: 14, color: workoutTheme.textSecondary },
});
