import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const GAP_DEG = 8;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export interface MacroWedge {
  label: string;
  progress: number;
  color: string;
}

interface MacroWedgeChartProps {
  wedges: MacroWedge[];
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Three (or more) independently-sized wedges, each fixed to an equal arc slice
 * of the circle. Each wedge fills from empty to full as its own progress goes
 * 0→1 — this is deliberately NOT a proportional pie chart.
 */
export function MacroWedgeChart({ wedges, size = 120, strokeWidth = 12, children, style }: MacroWedgeChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const segDeg = 360 / wedges.length;
  const arcDeg = Math.max(0, segDeg - GAP_DEG);
  const arcLen = (arcDeg / 360) * circumference;

  const offsets = useRef(wedges.map((w) => new Animated.Value(circumference - arcLen * clamp01(w.progress)))).current;

  useEffect(() => {
    wedges.forEach((w, i) => {
      Animated.timing(offsets[i], {
        toValue: circumference - arcLen * clamp01(w.progress),
        duration: 500,
        useNativeDriver: false,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedges.map((w) => w.progress).join(','), arcLen, circumference]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        {wedges.map((wedge, i) => {
          const rotation = -90 + i * segDeg;
          return (
            <G key={wedge.label}>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.border}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLen} ${circumference - arcLen}`}
                strokeLinecap="round"
                fill="none"
                rotation={rotation}
                origin={`${center}, ${center}`}
              />
              <AnimatedCircle
                cx={center}
                cy={center}
                r={radius}
                stroke={wedge.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={offsets[i]}
                strokeLinecap="round"
                fill="none"
                rotation={rotation}
                origin={`${center}, ${center}`}
              />
            </G>
          );
        })}
      </Svg>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
