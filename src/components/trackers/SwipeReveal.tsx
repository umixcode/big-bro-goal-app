import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, spacing } from '../../lib/theme';

const SWIPE_THRESHOLD_RATIO = 0.5;

interface SwipeRevealProps {
  front: React.ReactNode;
  back: React.ReactNode;
}

// A two-page horizontal carousel: `front` and `back` sit side by side in a
// double-width track that's clipped to one page's width, and dragging
// slides the track under the finger in real time (not just an instant
// content swap), snapping to whichever page is closer on release.
export function SwipeReveal({ front, back }: SwipeRevealProps) {
  const [width, setWidth] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const translateX = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      const base = showBack ? -width : 0;
      translateX.value = base + event.translationX;
    })
    .onEnd((event) => {
      const base = showBack ? -width : 0;
      const projected = base + event.translationX;
      const next = projected < -width * SWIPE_THRESHOLD_RATIO;
      translateX.value = withTiming(next ? -width : 0, { duration: 220 });
      if (next !== showBack) runOnJS(setShowBack)(next);
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View>
      <View onLayout={onLayout} style={styles.clip}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.track, { width: width * 2 }, trackStyle]}>
            <View style={{ width }}>{front}</View>
            <View style={{ width }}>{back}</View>
          </Animated.View>
        </GestureDetector>
      </View>
      <View style={styles.dots}>
        <View style={[styles.dot, !showBack && styles.dotActive]} />
        <View style={[styles.dot, showBack && styles.dotActive]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  track: { flexDirection: 'row', alignItems: 'flex-start' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.sm },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent },
});
