import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

interface CircularProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function CircularProgressRing({
  progress,
  size = 88,
  strokeWidth = 10,
  color = colors.accent,
  trackColor = colors.border,
  children,
  style,
}: CircularProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const clamped = clamp01(progress);

  const offset = useRef(new Animated.Value(circumference * (1 - clamped))).current;

  useEffect(() => {
    Animated.timing(offset, {
      toValue: circumference * (1 - clamp01(progress)),
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, circumference, offset]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
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
