import { ScrollView, StyleSheet, Text } from 'react-native';
import { SleepCard } from '../../../src/components/trackers/SleepCard';
import { FoodCard } from '../../../src/components/trackers/FoodCard';
import { WaterCard } from '../../../src/components/trackers/WaterCard';
import { WeightCard } from '../../../src/components/trackers/WeightCard';
import { useUserGoals } from '../../../src/hooks/useUserGoals';
import { useDailyTargets } from '../../../src/hooks/useDailyTargets';
import { colors, spacing, typography } from '../../../src/lib/theme';

export default function TrackersScreen() {
  const { data: userGoals } = useUserGoals();
  const { targets } = useDailyTargets();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.title}>Trackers</Text>
      <Text style={[typography.caption, { marginBottom: spacing.md }]}>
        Log today's sleep, food, water, and weight.
      </Text>

      {targets ? (
        <>
          <SleepCard sleepGoalHours={targets.sleepGoalHours} />
          <FoodCard
            calorieGoal={targets.calorieGoal}
            proteinGoal={targets.proteinG}
            fatGoal={targets.fatG}
            carbsGoal={targets.carbsG}
          />
          <WaterCard
            waterGoalMl={targets.waterGoalMl}
            cupMl={userGoals?.water_cup_ml ?? 240}
            bottleMl={userGoals?.water_bottle_ml ?? 500}
          />
        </>
      ) : (
        <Text style={[typography.caption, { marginBottom: spacing.md }]}>
          Finish onboarding (profile + goals) to see personalized targets.
        </Text>
      )}

      <WeightCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
