import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ExerciseTrendChart } from '../../../../src/components/workout/ExerciseTrendChart';
import { useExerciseHistory } from '../../../../src/hooks/useExerciseHistory';
import { useProfile } from '../../../../src/hooks/useProfile';
import { colors, spacing, typography } from '../../../../src/lib/theme';

export default function ExerciseHistoryScreen() {
  const { exerciseName } = useLocalSearchParams<{ exerciseName: string }>();
  const { data: profile } = useProfile();
  const { data: history = [] } = useExerciseHistory(exerciseName);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={typography.title}>{exerciseName}</Text>
      <Text style={[typography.caption, { marginBottom: spacing.md }]}>Top set per session</Text>
      <ExerciseTrendChart history={history} unitsPreference={profile?.units_preference ?? 'imperial'} />
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
