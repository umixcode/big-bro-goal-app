import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ProgramDayCard } from '../../../src/components/workout/ProgramDayCard';
import { useDefaultPhase, usePhaseDayExercises, usePhaseDays } from '../../../src/hooks/useWorkoutProgram';
import { useEnsureEnrollment } from '../../../src/hooks/useWorkoutEnrollment';
import { colors, spacing, typography } from '../../../src/lib/theme';
import type { WorkoutPhaseDay } from '../../../src/api/workoutPrograms';

function DayCard({ day }: { day: WorkoutPhaseDay }) {
  const router = useRouter();
  const { data: exercises = [] } = usePhaseDayExercises(day.id);

  return (
    <ProgramDayCard
      dayName={day.day_name}
      exerciseCount={exercises.length}
      onPress={() =>
        router.push({
          pathname: '/workout/session/[phaseDayId]',
          params: { phaseDayId: day.id, dayName: day.day_name },
        })
      }
    />
  );
}

export default function WorkoutScreen() {
  const { data: phase } = useDefaultPhase();
  useEnsureEnrollment(phase?.id);
  const { data: days = [] } = usePhaseDays(phase?.id);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={typography.title}>Workout</Text>
      {phase ? (
        <Text style={[typography.caption, { marginBottom: spacing.md }]}>
          {phase.program.name} · {phase.name}
        </Text>
      ) : (
        <Text style={[typography.caption, { marginBottom: spacing.md }]}>Loading your program…</Text>
      )}

      {days.map((day) => (
        <DayCard key={day.id} day={day} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});
