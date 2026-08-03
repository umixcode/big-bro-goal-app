import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionsForDate } from '../../../../src/hooks/useWorkoutSession';
import { useSessionSets } from '../../../../src/hooks/useLoggedSets';
import { spacing, workoutTheme } from '../../../../src/lib/theme';
import type { SessionForDate } from '../../../../src/api/workoutSessions';
import type { LoggedSet } from '../../../../src/api/loggedSets';

export default function PastWorkoutScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const insets = useSafeAreaInsets();
  const { data: sessions = [] } = useSessionsForDate(date);

  return (
    <ScrollView
      style={{ backgroundColor: workoutTheme.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>past workout</Text>
          <Text style={styles.title}>{dayjs(date).format('dddd, MMM D')}</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={22} color={workoutTheme.textMuted} />
        </Pressable>
      </View>

      {sessions.length === 0 && <Text style={styles.empty}>No workout logged this day.</Text>}

      {sessions.map((session) => (
        <PastSessionSection key={session.id} session={session} />
      ))}
    </ScrollView>
  );
}

function PastSessionSection({ session }: { session: SessionForDate }) {
  const { data: sets = [] } = useSessionSets(session.id);

  const byExercise = useMemo(() => {
    const map = new Map<string, LoggedSet[]>();
    for (const set of sets) {
      const list = map.get(set.exercise_name) ?? [];
      list.push(set);
      map.set(set.exercise_name, list);
    }
    return Array.from(map.entries());
  }, [sets]);

  if (byExercise.length === 0) return null;

  return (
    <View style={styles.sessionCard}>
      <Text style={styles.sessionTitle}>{session.dayName ?? 'Workout'}</Text>
      {byExercise.map(([exerciseName, exerciseSets]) => (
        <View key={exerciseName} style={styles.exerciseBlock}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          {[...exerciseSets]
            .sort((a, b) => a.set_number - b.set_number)
            .map((set) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setIndex}>{set.set_number}</Text>
                <Text style={styles.setValue}>
                  {set.weight != null ? `${set.weight} ${set.weight_unit} × ${set.reps}` : `${set.reps ?? '—'} reps`}
                </Text>
                {set.is_miss && <Ionicons name="close-circle" size={16} color={workoutTheme.danger} />}
                {set.is_warmup && <Text style={styles.warmupTag}>warmup</Text>}
              </View>
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: workoutTheme.background, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 13,
    color: workoutTheme.textMuted,
  },
  title: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 26,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    marginTop: 2,
  },
  empty: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 16,
    color: workoutTheme.textSecondary,
    marginTop: spacing.lg,
  },
  sessionCard: {
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 16,
    padding: spacing.md,
  },
  sessionTitle: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 18,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    marginBottom: spacing.sm,
  },
  exerciseBlock: { marginTop: spacing.sm },
  exerciseName: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 16,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    marginBottom: spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  setIndex: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 12,
    color: workoutTheme.textMuted,
    width: 16,
  },
  setValue: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 15,
    color: workoutTheme.textSecondary,
    flex: 1,
  },
  warmupTag: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
  },
});
