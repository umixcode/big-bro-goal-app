import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { RouteWorkout } from '../../../lib/healthkit';
import { formatDistance, formatDurationHM } from '../../../lib/units';
import { spacing, typography, workoutTheme } from '../../../lib/theme';

interface RouteMapChartProps {
  workout: RouteWorkout;
  unitsPreference: 'metric' | 'imperial';
}

const CHART_HEIGHT = 180;
const PADDING = 16;

const METERS_PER_MILE = 1609.344;

function formatPace(durationMinutes: number, distanceMeters: number, unitsPreference: 'metric' | 'imperial'): string {
  const distanceInUnits = unitsPreference === 'metric' ? distanceMeters / 1000 : distanceMeters / METERS_PER_MILE;
  if (distanceInUnits <= 0) return '—';
  const paceMinutes = durationMinutes / distanceInUnits;
  const min = Math.floor(paceMinutes);
  const sec = Math.round((paceMinutes - min) * 60);
  const unitLabel = unitsPreference === 'metric' ? '/km' : '/mi';
  return `${min}'${sec.toString().padStart(2, '0')}"${unitLabel}`;
}

// No basemap/street tiles here — this just plots the real recorded GPS
// points as a shape, longitude-scaled by cos(latitude) so it isn't visibly
// stretched, without adding a native maps dependency.
export function RouteMapChart({ workout, unitsPreference }: RouteMapChartProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const lats = workout.points.map((p) => p.latitude);
  const lngs = workout.points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const avgLat = (minLat + maxLat) / 2;
  const lngScale = Math.cos((avgLat * Math.PI) / 180);

  const projected = workout.points.map((p) => ({
    x: (p.longitude - minLng) * lngScale,
    y: maxLat - p.latitude,
  }));

  const spanX = Math.max(...projected.map((p) => p.x), 0.00001);
  const spanY = Math.max(...projected.map((p) => p.y), 0.00001);

  let pathD = '';
  let startPoint: { x: number; y: number } | null = null;
  let endPoint: { x: number; y: number } | null = null;

  if (width > 0) {
    const drawWidth = width - PADDING * 2;
    const drawHeight = CHART_HEIGHT - PADDING * 2;
    const scale = Math.min(drawWidth / spanX, drawHeight / spanY);
    const offsetX = PADDING + (drawWidth - spanX * scale) / 2;
    const offsetY = PADDING + (drawHeight - spanY * scale) / 2;

    const screenPoints = projected.map((p) => ({ x: offsetX + p.x * scale, y: offsetY + p.y * scale }));
    pathD = screenPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    startPoint = screenPoints[0];
    endPoint = screenPoints[screenPoints.length - 1];
  }

  return (
    <View>
      <Text style={styles.activityLabel}>{workout.activityType === 'running' ? 'Outdoor Run' : 'Outdoor Walk'}</Text>
      <View style={{ height: CHART_HEIGHT }} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Path d={pathD} fill="none" stroke={workoutTheme.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            {startPoint && <Circle cx={startPoint.x} cy={startPoint.y} r={5} fill={workoutTheme.accent} />}
            {endPoint && <Circle cx={endPoint.x} cy={endPoint.y} r={5} fill={workoutTheme.textPrimary} />}
          </Svg>
        )}
      </View>
      <View style={styles.statsRow}>
        <RouteStat label="Distance" value={formatDistance(workout.distanceMeters, unitsPreference)} />
        <RouteStat label="Duration" value={formatDurationHM(workout.durationMinutes)} />
        <RouteStat label="Avg Pace" value={formatPace(workout.durationMinutes, workout.distanceMeters, unitsPreference)} />
      </View>
    </View>
  );
}

function RouteStat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  activityLabel: { ...typography.caption, color: workoutTheme.accent, fontWeight: '600', marginBottom: spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  statValue: { ...typography.heading, fontSize: 16 },
});
