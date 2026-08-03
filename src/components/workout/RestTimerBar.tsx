import { useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, workoutTheme } from '../../lib/theme';
import { endRestActivity, startRestActivity, updateRestActivity } from '../../lib/restActivity';

interface RestTimerBarProps {
  exerciseName: string;
  initialSeconds: number;
  onDismiss: () => void;
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function remainingFrom(endAt: number): number {
  return Math.max(0, Math.round((endAt - Date.now()) / 1000));
}

export function RestTimerBar({ exerciseName, initialSeconds, onDismiss }: RestTimerBarProps) {
  // A real end-timestamp (not a decrementing counter) is what makes this
  // correct across backgrounding — JS timers stall while the app is
  // suspended, but recomputing from Date.now() on every tick/resume always
  // lands on the right value regardless of how long the app was away.
  const [endAt, setEndAt] = useState(() => Date.now() + initialSeconds * 1000);
  const [remaining, setRemaining] = useState(() => remainingFrom(endAt));

  useEffect(() => {
    startRestActivity(exerciseName, endAt);
    return () => endRestActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateRestActivity(endAt);
    const tick = () => setRemaining(remainingFrom(endAt));
    tick();
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [endAt]);

  const done = remaining <= 0;

  const adjust = (deltaSeconds: number) => setEndAt((prev) => Math.max(Date.now(), prev + deltaSeconds * 1000));

  return (
    <View style={styles.bar}>
      <Pressable style={styles.adjustButton} onPress={() => adjust(-15)}>
        <Text style={styles.adjustText}>−15</Text>
      </Pressable>

      <View style={styles.center}>
        <Text style={[styles.clock, done && styles.clockDone]}>{formatClock(remaining)}</Text>
        <Text style={styles.exerciseName}>{exerciseName}</Text>
      </View>

      <Pressable style={styles.adjustButton} onPress={() => adjust(15)}>
        <Text style={styles.adjustText}>+15</Text>
      </Pressable>

      <Pressable onPress={onDismiss} hitSlop={8} style={styles.closeButton}>
        <Ionicons name="close" size={18} color={workoutTheme.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: workoutTheme.surfaceRaised,
    borderWidth: 1,
    borderColor: workoutTheme.accentMuted,
    borderRadius: 9999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: workoutTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustText: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 13,
    color: workoutTheme.textSecondary,
  },
  center: { flex: 1, alignItems: 'center' },
  clock: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 28,
    fontWeight: '700',
    color: workoutTheme.accent,
  },
  clockDone: {
    color: workoutTheme.textPrimary,
  },
  exerciseName: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
    marginTop: 2,
  },
  closeButton: { paddingLeft: spacing.xs },
});
