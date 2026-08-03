import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DayProgressHeader } from '../../../../src/components/workout/DayProgressHeader';
import { ExerciseLogger } from '../../../../src/components/workout/ExerciseLogger';
import { RestTimerBar } from '../../../../src/components/workout/RestTimerBar';
import { usePhaseDayExercises, usePhaseDays } from '../../../../src/hooks/useWorkoutProgram';
import { useEndSession, usePhaseDayCompletion, useTodaysSession } from '../../../../src/hooks/useWorkoutSession';
import { useSessionSets } from '../../../../src/hooks/useLoggedSets';
import { spacing, workoutTheme } from '../../../../src/lib/theme';

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { phaseDayId, dayName, phaseId } = useLocalSearchParams<{
    phaseDayId: string;
    dayName?: string;
    phaseId?: string;
  }>();
  const { data: days = [] } = usePhaseDays(phaseId);
  const { data: exercises = [] } = usePhaseDayExercises(phaseDayId);
  const { data: session } = useTodaysSession(phaseDayId);
  const { data: sessionSets = [] } = useSessionSets(session?.id);
  const { data: completionMap = {} } = usePhaseDayCompletion(days.map((d) => d.id));
  const endSession = useEndSession();
  const insets = useSafeAreaInsets();

  const [activeRest, setActiveRest] = useState<{ key: number; exerciseName: string; seconds: number } | null>(
    null
  );

  const totalCount = useMemo(
    () => exercises.reduce((sum, exercise) => sum + (exercise.working_sets ?? 0), 0),
    [exercises]
  );

  const completedDayIds = useMemo(
    () => new Set(Object.entries(completionMap).filter(([, complete]) => complete).map(([id]) => id)),
    [completionMap]
  );

  const onFinish = () => {
    if (!session) return;
    endSession.mutate(session.id, { onSuccess: () => router.back() });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ backgroundColor: workoutTheme.background }}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}
      >
        <DayProgressHeader
          dayName={dayName ?? 'Workout'}
          days={days}
          currentDayId={phaseDayId}
          completedDayIds={completedDayIds}
          loggedCount={sessionSets.length}
          totalCount={totalCount}
        />

        {!session ? (
          <Text style={styles.loading}>Starting session…</Text>
        ) : (
          <>
            {exercises.map((exercise) => (
              <ExerciseLogger
                key={exercise.id}
                sessionId={session.id}
                phaseExercise={exercise}
                sessionSets={sessionSets}
                onSetLogged={(exerciseName, seconds) =>
                  setActiveRest({ key: Date.now(), exerciseName, seconds })
                }
              />
            ))}

            <Pressable
              style={[styles.finishButton, endSession.isPending && styles.finishButtonDisabled]}
              onPress={onFinish}
              disabled={endSession.isPending}
            >
              <Text style={styles.finishButtonText}>{endSession.isPending ? 'Finishing…' : 'Finish workout'}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {activeRest && (
        <View style={[styles.restTimerWrap, { bottom: insets.bottom + spacing.lg }]}>
          <RestTimerBar
            key={activeRest.key}
            exerciseName={activeRest.exerciseName}
            initialSeconds={activeRest.seconds}
            onDismiss={() => setActiveRest(null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: workoutTheme.background },
  scroll: { padding: spacing.lg },
  restTimerWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  loading: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 16,
    color: workoutTheme.textSecondary,
    marginTop: spacing.md,
  },
  finishButton: {
    backgroundColor: workoutTheme.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  finishButtonDisabled: { opacity: 0.5 },
  finishButtonText: { color: workoutTheme.background, fontWeight: '700', fontSize: 16 },
});
