import { useState } from 'react';
import dayjs from 'dayjs';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import type { SleepStage, SleepStageSegment } from '../../../lib/sleepAggregation';
import { radii, sleepStageColors, spacing, typography, workoutTheme } from '../../../lib/theme';
import { formatDurationHM } from '../../../lib/units';

interface SleepStagesChartProps {
  segments: SleepStageSegment[] | null;
  startTime: string | null;
  endTime: string | null;
  deepMinutes: number | null;
  lightMinutes: number | null;
  remMinutes: number | null;
  awakeMinutes: number | null;
}

// Top-to-bottom lane order matches how sleep apps conventionally draw a
// hypnogram — lightest/most-awake stages on top, deepest on the bottom.
const LANES: { key: SleepStage; label: string; color: string }[] = [
  { key: 'awake', label: 'Awake', color: sleepStageColors.awake },
  { key: 'rem', label: 'REM', color: sleepStageColors.rem },
  { key: 'light', label: 'Light', color: sleepStageColors.light },
  { key: 'deep', label: 'Deep', color: sleepStageColors.deep },
];

const CHART_HEIGHT = 110;
const LANE_GAP = 4;
const LABEL_WIDTH = 44;
const LANE_HEIGHT = (CHART_HEIGHT - LANE_GAP * (LANES.length - 1)) / LANES.length;

export function SleepStagesChart({
  segments,
  startTime,
  endTime,
  deepMinutes,
  lightMinutes,
  remMinutes,
  awakeMinutes,
}: SleepStagesChartProps) {
  const [chartWidth, setChartWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setChartWidth(event.nativeEvent.layout.width);

  const minutesByStage: Record<SleepStage, number> = {
    deep: deepMinutes ?? 0,
    light: lightMinutes ?? 0,
    rem: remMinutes ?? 0,
    awake: awakeMinutes ?? 0,
  };

  if (!segments || segments.length === 0 || !startTime || !endTime) {
    return (
      <Text style={[typography.caption, styles.empty]}>
        No stage timeline for this night — Apple Watch is needed for REM/light/deep detail.
      </Text>
    );
  }

  const start = dayjs(startTime).valueOf();
  const end = dayjs(endTime).valueOf();
  const span = Math.max(end - start, 1);

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.laneLabels}>
          {LANES.map((lane) => (
            <View key={lane.key} style={[styles.laneLabelRow, { height: LANE_HEIGHT }]}>
              <Text style={styles.laneLabel}>{lane.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartArea} onLayout={onLayout}>
          {chartWidth > 0 && (
            <Svg width={chartWidth} height={CHART_HEIGHT}>
              {LANES.map((lane, i) => (
                <Line
                  key={lane.key}
                  x1={0}
                  x2={chartWidth}
                  y1={i * (LANE_HEIGHT + LANE_GAP) + LANE_HEIGHT / 2}
                  y2={i * (LANE_HEIGHT + LANE_GAP) + LANE_HEIGHT / 2}
                  stroke={workoutTheme.border}
                  strokeWidth={1}
                />
              ))}
              {segments.map((segment, i) => {
                const laneIndex = LANES.findIndex((lane) => lane.key === segment.stage);
                if (laneIndex === -1) return null;
                const segStart = dayjs(segment.start).valueOf();
                const segEnd = dayjs(segment.end).valueOf();
                const x = ((segStart - start) / span) * chartWidth;
                const w = Math.max(1.5, ((segEnd - segStart) / span) * chartWidth);
                const y = laneIndex * (LANE_HEIGHT + LANE_GAP);
                return <Rect key={i} x={x} y={y} width={w} height={LANE_HEIGHT} rx={3} fill={LANES[laneIndex].color} />;
              })}
            </Svg>
          )}
        </View>
      </View>

      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>{dayjs(startTime).format('h:mm A')}</Text>
        <Text style={styles.xLabel}>{dayjs(endTime).format('h:mm A')}</Text>
      </View>

      <View style={styles.legend}>
        {LANES.map((lane) => (
          <View key={lane.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: lane.color }]} />
            <Text style={typography.caption}>{lane.label}</Text>
            <Text style={styles.legendValue}>{formatDurationHM(minutesByStage[lane.key])}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  laneLabels: { width: LABEL_WIDTH, justifyContent: 'flex-start' },
  laneLabelRow: { justifyContent: 'center', marginBottom: LANE_GAP },
  laneLabel: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 10,
    color: workoutTheme.textMuted,
  },
  chartArea: { flex: 1, height: CHART_HEIGHT },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: LABEL_WIDTH,
    marginTop: spacing.xs,
  },
  xLabel: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 12,
    color: workoutTheme.textMuted,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: radii.full },
  legendValue: { ...typography.caption, color: workoutTheme.textPrimary },
  empty: { marginTop: spacing.sm },
});
