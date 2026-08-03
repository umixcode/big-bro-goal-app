import { useState } from 'react';
import dayjs from 'dayjs';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import type { WeightLog } from '../../api/weightLogs';
import { kgToLb } from '../../lib/units';
import { spacing, workoutTheme } from '../../lib/theme';

interface WeightTrendChartProps {
  logs: WeightLog[];
  unitsPreference: 'metric' | 'imperial';
}

// Straight segments between consecutive points — unlike a smoothed bezier
// curve, this guarantees the line passes through every logged point
// exactly, which matters here since weight entries are often sparse
// (a smoothed curve visibly missed interior points with few, widely
// spaced entries).
function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

const CHART_HEIGHT = 200;
const Y_AXIS_WIDTH = 40;

export function WeightTrendChart({ logs, unitsPreference }: WeightTrendChartProps) {
  const [width, setWidth] = useState(0);
  const displayWeight = (kg: number) => (unitsPreference === 'metric' ? kg : kgToLb(kg));

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  if (logs.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.empty}>Log weight to see your trend.</Text>
      </View>
    );
  }

  const weights = logs.map((l) => displayWeight(l.weight_kg));
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const range = max - min || 1;
  const mid = (max + min) / 2;

  const chartWidth = Math.max(0, width - Y_AXIS_WIDTH);
  const plotHeight = CHART_HEIGHT * 0.75;
  const plotTop = CHART_HEIGHT * 0.05;

  const yFor = (v: number) => plotTop + plotHeight - ((v - min) / range) * plotHeight;

  let chart = null;
  if (chartWidth > 0) {
    const stepX = weights.length > 1 ? chartWidth / (weights.length - 1) : 0;
    const points = weights.map((v, i) => ({ x: i * stepX, y: yFor(v) }));
    const linePath = buildLinePath(points);
    const areaBottom = plotTop + plotHeight;
    const areaPath = `${linePath} L ${chartWidth} ${areaBottom} L 0 ${areaBottom} Z`;
    const last = points[points.length - 1];

    chart = (
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="weightTrendFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={workoutTheme.accent} stopOpacity={0.3} />
            <Stop offset="1" stopColor={workoutTheme.accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {[max, mid, min].map((v) => (
          <Line
            key={v}
            x1={0}
            x2={chartWidth}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke={workoutTheme.border}
            strokeWidth={1}
          />
        ))}
        {weights.length > 1 && <Path d={areaPath} fill="url(#weightTrendFill)" stroke="none" />}
        {weights.length > 1 && (
          <Path
            d={linePath}
            fill="none"
            stroke={workoutTheme.accent}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <Line
          x1={last.x}
          x2={last.x}
          y1={last.y}
          y2={areaBottom}
          stroke={workoutTheme.accentMuted}
          strokeWidth={1}
          strokeDasharray="3,4"
        />
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 5 : 3}
            fill={i === points.length - 1 ? workoutTheme.accent : workoutTheme.surface}
            stroke={workoutTheme.accent}
            strokeWidth={i === points.length - 1 ? 0 : 1.5}
          />
        ))}
      </Svg>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{max.toFixed(0)}</Text>
          <Text style={styles.yLabel}>{mid.toFixed(0)}</Text>
          <Text style={styles.yLabel}>{min.toFixed(0)}</Text>
        </View>
        <View style={styles.chartArea} onLayout={onLayout}>
          {chart}
        </View>
      </View>
      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>{dayjs(logs[0].date).format('MMM D')}</Text>
        <Text style={styles.xLabel}>{dayjs(logs[logs.length - 1].date).format('MMM D')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 16,
    padding: spacing.md,
  },
  empty: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 16,
    color: workoutTheme.textSecondary,
  },
  row: { flexDirection: 'row' },
  yAxis: {
    width: Y_AXIS_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    paddingVertical: CHART_HEIGHT * 0.05,
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
  },
  yLabel: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 11,
    color: workoutTheme.textMuted,
  },
  chartArea: { flex: 1, height: CHART_HEIGHT },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: Y_AXIS_WIDTH,
    marginTop: spacing.xs,
  },
  xLabel: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 12,
    color: workoutTheme.textMuted,
  },
});
