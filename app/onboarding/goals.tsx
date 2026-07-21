import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile, useUpsertProfile } from '../../src/hooks/useProfile';
import { useUpsertUserGoals } from '../../src/hooks/useUserGoals';
import { colors, spacing, radii, typography } from '../../src/lib/theme';
import { parseWeightToKg } from '../../src/lib/units';

export default function OnboardingGoalsScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const upsertProfile = useUpsertProfile();
  const upsertGoals = useUpsertUserGoals();

  const unitsPreference = profile?.units_preference ?? 'imperial';
  const [desiredWeight, setDesiredWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [sleepGoalHours, setSleepGoalHours] = useState('8');
  const [stepGoal, setStepGoal] = useState('4000');

  const weightLabel = unitsPreference === 'metric' ? 'Desired Weight (kg)' : 'Desired Weight (lb)';

  const onFinish = async () => {
    const desiredWeightValue = Number(desiredWeight);
    if (!desiredWeightValue) return Alert.alert('Missing info', 'Please enter your desired weight.');
    if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return Alert.alert('Invalid date', 'Enter target date as YYYY-MM-DD, or leave it blank.');
    }

    try {
      await upsertGoals.mutateAsync({
        desired_weight_kg: parseWeightToKg(desiredWeightValue, unitsPreference),
        target_date: targetDate || null,
        sleep_goal_hours: Number(sleepGoalHours) || 8,
        step_goal: Number(stepGoal) || 4000,
      });
      await upsertProfile.mutateAsync({ onboarding_completed_at: new Date().toISOString() });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Something went wrong', error.message ?? String(error));
    }
  };

  const isSaving = upsertGoals.isPending || upsertProfile.isPending;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.title}>Set your goals</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
        We'll calculate what you need to do daily to hit these.
      </Text>

      <TextInput
        style={styles.input}
        placeholder={weightLabel}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={desiredWeight}
        onChangeText={setDesiredWeight}
      />

      <TextInput
        style={styles.input}
        placeholder="Target date (YYYY-MM-DD, optional)"
        placeholderTextColor={colors.textMuted}
        value={targetDate}
        onChangeText={setTargetDate}
      />

      <TextInput
        style={styles.input}
        placeholder="Sleep goal (hours)"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={sleepGoalHours}
        onChangeText={setSleepGoalHours}
      />

      <TextInput
        style={styles.input}
        placeholder="Daily step goal"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={stepGoal}
        onChangeText={setStepGoal}
      />

      <Pressable style={styles.button} onPress={onFinish} disabled={isSaving}>
        <Text style={styles.buttonText}>{isSaving ? 'Saving…' : 'Finish'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
