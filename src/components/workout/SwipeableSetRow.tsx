import { useCallback } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { workoutTheme } from '../../lib/theme';

const SWIPE_THRESHOLD = 72;

interface SwipeableSetRowProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onSwipeComplete: () => void;
  onSwipeMiss: () => void;
}

// Swipe right to mark a pending set as hit, left to mark it as missed —
// an alternative to the "hit it → / miss" buttons for logging without
// having to reach for text.
export function SwipeableSetRow({ children, style, onSwipeComplete, onSwipeMiss }: SwipeableSetRowProps) {
  const translateX = useSharedValue(0);

  const triggerComplete = useCallback(() => onSwipeComplete(), [onSwipeComplete]);
  const triggerMiss = useCallback(() => onSwipeMiss(), [onSwipeMiss]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(triggerComplete)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(triggerMiss)();
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const hitHintStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(1, translateX.value / SWIPE_THRESHOLD) : 0,
  }));

  const missHintStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(1, -translateX.value / SWIPE_THRESHOLD) : 0,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.hint, styles.hintLeft, hitHintStyle]}>
        <Ionicons name="checkmark" size={20} color={workoutTheme.accent} />
      </Animated.View>
      <Animated.View style={[styles.hint, styles.hintRight, missHintStyle]}>
        <Ionicons name="close" size={20} color={workoutTheme.danger} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[style, rowStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  hint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintLeft: { left: 0 },
  hintRight: { right: 0 },
});
