import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../ui/Card';
import { OverloadIndicator } from './OverloadIndicator';
import { useSessionSets, usePreviousTopSet, useCreateLoggedSet } from '../../hooks/useLoggedSets';
import { useProfile } from '../../hooks/useProfile';
import { compareOverload, toKg } from '../../lib/workoutStats';
import { colors, radii, spacing, typography } from '../../lib/theme';
import type { WorkoutPhaseExercise } from '../../api/workoutPrograms';

interface ExerciseLoggerProps {
  sessionId: string;
  phaseExercise: WorkoutPhaseExercise;
}

export function ExerciseLogger({ sessionId, phaseExercise }: ExerciseLoggerProps) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: sessionSets = [] } = useSessionSets(sessionId);
  const { data: previousTopSet } = usePreviousTopSet(phaseExercise.exercise_name, sessionId);
  const createSet = useCreateLoggedSet(sessionId);

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [newRecordBanner, setNewRecordBanner] = useState(false);

  const unitsPreference = profile?.units_preference ?? 'imperial';
  const weightUnit: 'lb' | 'kg' = unitsPreference === 'metric' ? 'kg' : 'lb';

  const setsForExercise = useMemo(
    () => sessionSets.filter((set) => set.exercise_name === phaseExercise.exercise_name),
    [sessionSets, phaseExercise.exercise_name]
  );

  const currentTopKg = useMemo(() => {
    const workingSets = setsForExercise.filter((set) => !set.is_warmup && set.weight != null);
    if (workingSets.length === 0) return null;
    return Math.max(...workingSets.map((set) => toKg(set.weight as number, set.weight_unit)));
  }, [setsForExercise]);

  const previousTopKg = previousTopSet ? toKg(previousTopSet.weight, previousTopSet.weight_unit) : null;
  const overloadDirection = compareOverload(currentTopKg, previousTopKg);

  const onAddSet = () => {
    const weightNum = Number(weight);
    const repsNum = Number(reps);
    if (!weightNum || !repsNum) return;

    createSet.mutate(
      {
        phase_exercise_id: phaseExercise.id,
        exercise_name: phaseExercise.exercise_name,
        set_number: setsForExercise.length + 1,
        is_warmup: isWarmup,
        weight: weightNum,
        weight_unit: weightUnit,
        reps: repsNum,
        rpe: rpe ? Number(rpe) : null,
      },
      {
        onSuccess: ({ newOneRepMax }) => {
          setWeight('');
          setReps('');
          setRpe('');
          setIsWarmup(false);
          if (newOneRepMax) {
            setNewRecordBanner(true);
            setTimeout(() => setNewRecordBanner(false), 3000);
          }
        },
      }
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={typography.heading}>{phaseExercise.exercise_name}</Text>
        {overloadDirection !== 'none' && <OverloadIndicator direction={overloadDirection} />}
      </View>
      <Text style={[typography.caption, { marginTop: spacing.xs }]}>
        {phaseExercise.working_sets} working sets · {phaseExercise.reps_range} reps · RPE{' '}
        {phaseExercise.early_set_rpe}–{phaseExercise.last_set_rpe} · rest {phaseExercise.rest}
      </Text>
      {previousTopSet && (
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          Last time: {previousTopSet.weight} {previousTopSet.weight_unit} × {previousTopSet.reps}
        </Text>
      )}
      {newRecordBanner && <Text style={styles.recordBanner}>New 1RM! 🏋</Text>}

      {setsForExercise.length > 0 && (
        <View style={styles.setsList}>
          {setsForExercise.map((set, index) => (
            <Text key={set.id} style={[typography.caption, styles.setRow]}>
              Set {index + 1} · {set.weight} {set.weight_unit} × {set.reps}
              {set.rpe ? ` · RPE ${set.rpe}` : ''}
              {set.is_warmup ? ' · warmup' : ''}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={`Weight (${weightUnit})`}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          style={styles.input}
          placeholder="Reps"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={reps}
          onChangeText={setReps}
        />
        <TextInput
          style={styles.input}
          placeholder="RPE"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={rpe}
          onChangeText={setRpe}
        />
      </View>
      <View style={styles.formRow}>
        <Pressable style={styles.warmupToggle} onPress={() => setIsWarmup((prev) => !prev)}>
          <Text style={[typography.caption, isWarmup && { color: colors.accent }]}>
            {isWarmup ? '☑' : '☐'} Warmup
          </Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onAddSet} disabled={createSet.isPending}>
          <Text style={styles.buttonText}>{createSet.isPending ? 'Saving…' : '+ Add set'}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() =>
          router.push({
            pathname: '/workout/exercise/[exerciseName]',
            params: { exerciseName: phaseExercise.exercise_name },
          })
        }
      >
        <Text style={styles.historyLink}>View history →</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordBanner: { color: colors.success, fontWeight: '700', marginTop: spacing.xs },
  setsList: { marginTop: spacing.sm, gap: 2 },
  setRow: {},
  form: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  warmupToggle: { paddingVertical: spacing.xs },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: colors.onAccent, fontWeight: '600' },
  historyLink: { color: colors.accent, marginTop: spacing.sm, fontSize: 13 },
});
