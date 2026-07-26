import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoals } from '../../hooks/useGoals';
import type { GoalCategory } from '../../api/goals';
import { Card } from '../ui/Card';
import { spacing, typography } from '../../lib/theme';

const categoryLabels: Record<GoalCategory, string> = {
  weight: 'Weight',
  sleep: 'Sleep',
  food: 'Food',
  reading: 'Reading',
  prayer: 'Prayer',
  workout: 'Workout',
  custom: 'Custom',
};

export function TodaysGoalsCard() {
  const router = useRouter();
  const { data: goals = [] } = useGoals();
  const active = goals.filter((goal) => goal.status === 'active').slice(0, 5);

  return (
    <Card onPress={() => router.push('/(tabs)/calendar')}>
      <Text style={typography.eyebrow}>Today's Goals</Text>
      <View style={{ marginTop: spacing.sm }}>
        {active.length === 0 && <Text style={typography.caption}>No active goals yet.</Text>}
        {active.map((goal) => (
          <View key={goal.id} style={styles.row}>
            <Text style={typography.body}>{goal.title}</Text>
            <Text style={typography.caption}>{categoryLabels[goal.category]}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
