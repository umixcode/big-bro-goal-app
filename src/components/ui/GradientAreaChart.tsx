import { useState } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { colors } from '../../lib/theme';

interface GradientAreaChartProps {
  values: number[];
  height?: number;
  color?: string;
  style?: ViewStyle;
}

// Builds a smooth path through points using simple quadratic-bezier midpoint
// smoothing (each segment curves toward the midpoint between consecutive
// points) — lightweight, no external charting library, visually close to a
// proper spline for small trend charts like this.
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

export function GradientAreaChart({ values, height = 60, color = colors.accent, style }: GradientAreaChartProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  if (values.length < 2) return <View style={[{ height }, style]} onLayout={onLayout} />;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  let content = null;
  if (width > 0) {
    const stepX = width / (values.length - 1);
    const points = values.map((v, i) => ({
      x: i * stepX,
      y: height - ((v - min) / range) * (height * 0.8) - height * 0.1,
    }));

    const linePath = buildSmoothPath(points);
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    content = (
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#areaFill)" stroke="none" />
        <Path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return (
    <View style={[{ width: '100%', height }, style]} onLayout={onLayout}>
      {content}
    </View>
  );
}
