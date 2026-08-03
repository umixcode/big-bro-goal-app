import { useState } from 'react';
import dayjs from 'dayjs';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { kgToLb } from '../../lib/units';
import { spacing, workoutTheme } from '../../lib/theme';
import type { SessionHistoryEntry } from '../../lib/workoutStats';

interface ExerciseTrendChartProps {
  sessions: SessionHistoryEntry[];
  unitsPreference: 'metric' | 'imperial';
}

// Midpoint-smoothing: each segment curves toward the midpoint of its two
// endpoints rather than straight lines, giving a soft trend line.
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    d += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

const CHART_HEIGHT = 200;
const Y_AXIS_WIDTH = 40;

export function ExerciseTrendChart({ sessions, unitsPreference }: ExerciseTrendChartProps) {
  const [width, setWidth] = useState(0);
  const displayWeight = (kg: number) => (unitsPreference === 'metric' ? kg : kgToLb(kg));

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  if (sessions.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.empty}>No sets logged yet for this exercise.</Text>
      </View>
    );
  }

  const weights = sessions.map((s) => displayWeight(s.topWeightKg));
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
    const linePath = buildSmoothPath(points);
    const areaBottom = plotTop + plotHeight;
    const areaPath = `${linePath} L ${chartWidth} ${areaBottom} L 0 ${areaBottom} Z`;
    const last = points[points.length - 1];

    chart = (
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="exerciseTrendFill" x1="0" y1="0" x2="0" y2="1">
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
        {weights.length > 1 && <Path d={areaPath} fill="url(#exerciseTrendFill)" stroke="none" />}
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
        <Text style={styles.xLabel}>{dayjs(sessions[0].date).format('MMM D')}</Text>
        <Text style={styles.xLabel}>{dayjs(sessions[sessions.length - 1].date).format('MMM D')}</Text>
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
