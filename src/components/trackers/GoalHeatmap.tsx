import { useState } from 'react';
import dayjs from 'dayjs';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { HeatmapDay } from '../../lib/goalHeatmap';
import { colors, spacing, typography, workoutTheme } from '../../lib/theme';

const CELL_GAP = 3;
const ROWS = 7;
const LABEL_WIDTH = 22;
const LABEL_ROWS = [0, 2, 4, 6];

interface GoalHeatmapProps {
  title: string;
  days: HeatmapDay[];
  color?: string;
}

// GitHub-contributions-style grid: each column is one week, each row one
// weekday, oldest week on the left. `days` is a flat chronological run
// (oldest first) whose length is a multiple of 7 — sliced into columns of 7
// here rather than aligned to real calendar week boundaries, since exact
// week alignment isn't important for a personal streak view. Because every
// column is exactly 7 days, row index r always lands on the same weekday
// across every column, so weekday row labels stay accurate.
//
// Cell size is derived from the measured container width rather than a
// fixed pixel size, so the grid always spans the full card edge-to-edge
// instead of leaving empty space beside a small fixed-size grid.
export function GoalHeatmap({ title, days, color = colors.accent }: GoalHeatmapProps) {
  const [gridWidth, setGridWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setGridWidth(event.nativeEvent.layout.width);
  };

  const columns: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += ROWS) {
    columns.push(days.slice(i, i + ROWS));
  }
  const columnCount = columns.length;

  const cellSize = columnCount > 0 ? (gridWidth - (columnCount - 1) * CELL_GAP) / columnCount : 0;
  const rowHeight = cellSize + CELL_GAP;

  const startWeekday = days.length > 0 ? dayjs(days[0].date).day() : 0;
  const metCount = days.filter((d) => d.met).length;

  return (
    <View>
      <Text style={typography.heading}>{title}</Text>
      <View style={styles.row}>
        <View style={styles.rowLabels}>
          {Array.from({ length: ROWS }, (_, r) => (
            <Text key={r} style={[styles.rowLabel, { height: rowHeight, lineHeight: rowHeight }]}>
              {LABEL_ROWS.includes(r) ? dayjs().day((startWeekday + r) % 7).format('ddd') : ''}
            </Text>
          ))}
        </View>
        <View style={styles.grid} onLayout={onLayout}>
          {gridWidth > 0 &&
            columns.map((column, colIndex) => (
              <View key={colIndex} style={styles.column}>
                {column.map((day) => (
                  <View
                    key={day.date}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize },
                      day.met
                        ? { backgroundColor: color }
                        : day.hasData
                          ? styles.cellLogged
                          : styles.cellEmpty,
                    ]}
                  />
                ))}
              </View>
            ))}
        </View>
      </View>
      <Text style={[typography.caption, styles.caption]}>
        {metCount} goal {metCount === 1 ? 'day' : 'days'} met in the last {days.length / 7} weeks
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: spacing.sm },
  rowLabels: { width: LABEL_WIDTH, justifyContent: 'flex-start' },
  rowLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontFamily: workoutTheme.fontMono,
  },
  grid: { flex: 1, flexDirection: 'row', gap: CELL_GAP },
  column: { gap: CELL_GAP },
  cell: {
    borderRadius: 2,
  },
  cellLogged: { backgroundColor: workoutTheme.accentMuted },
  cellEmpty: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  caption: { marginTop: spacing.sm },
});
