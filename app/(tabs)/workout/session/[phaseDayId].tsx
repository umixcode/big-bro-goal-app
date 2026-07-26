import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ExerciseLogger } from '../../../../src/components/workout/ExerciseLogger';
import { usePhaseDayExercises } from '../../../../src/hooks/useWorkoutProgram';
import { useEndSession, useTodaysSession } from '../../../../src/hooks/useWorkoutSession';
import { colors, radii, spacing, typography } from '../../../../src/lib/theme';

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { phaseDayId, dayName } = useLocalSearchParams<{ phaseDayId: string; dayName?: string }>();
  const { data: exercises = [] } = usePhaseDayExercises(phaseDayId);
  const { data: session } = useTodaysSession(phaseDayId);
  const endSession = useEndSession();
  const insets = useSafeAreaInsets();

  const onFinish = () => {
    if (!session) return;
    endSession.mutate(session.id, { onSuccess: () => router.back() });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]}
      >
        <Text style={[typography.title, { marginBottom: spacing.lg }]}>{dayName ?? 'Workout'}</Text>

        {!session ? (
          <Text style={[typography.caption, { marginTop: spacing.md }]}>Starting session…</Text>
        ) : (
          exercises.map((exercise) => (
            <ExerciseLogger key={exercise.id} sessionId={session.id} phaseExercise={exercise} />
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={[styles.finishButton, !session && styles.finishButtonDisabled]}
          onPress={onFinish}
          disabled={!session || endSession.isPending}
        >
          <Text style={styles.finishButtonText}>{endSession.isPending ? 'Finishing…' : 'Finish workout'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.background,
  },
  finishButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  finishButtonDisabled: { opacity: 0.5 },
  finishButtonText: { color: colors.onAccent, fontWeight: '700', fontSize: 16 },
});
