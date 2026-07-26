import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUpsertProfile } from '../../src/hooks/useProfile';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { colors, spacing, radii, typography } from '../../src/lib/theme';
import { parseHeightToCm, parseWeightToKg } from '../../src/lib/units';
import type { ActivityLevel, Gender, UnitsPreference } from '../../src/api/profiles';

const activityOptions: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const upsertProfile = useUpsertProfile();

  const [unitsPreference, setUnitsPreference] = useState<UnitsPreference>('imperial');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  const heightLabel = unitsPreference === 'metric' ? 'Height (cm)' : 'Height (inches)';
  const weightLabel = unitsPreference === 'metric' ? 'Current Weight (kg)' : 'Current Weight (lb)';

  const onContinue = async () => {
    const dobPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!gender) return Alert.alert('Missing info', 'Please select your gender.');
    if (!dobPattern.test(dateOfBirth)) return Alert.alert('Invalid date', 'Enter date of birth as YYYY-MM-DD.');
    const heightValue = Number(height);
    const weightValue = Number(weight);
    if (!heightValue || !weightValue) return Alert.alert('Missing info', 'Please enter height and weight.');

    try {
      await upsertProfile.mutateAsync({
        full_name: fullName || null,
        gender,
        date_of_birth: dateOfBirth,
        height_cm: parseHeightToCm(heightValue, unitsPreference),
        current_weight_kg: parseWeightToKg(weightValue, unitsPreference),
        activity_level: activityLevel,
        units_preference: unitsPreference,
      });
      router.push('/onboarding/goals');
    } catch (error: any) {
      Alert.alert('Something went wrong', error.message ?? String(error));
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={typography.title}>Tell us about you</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
        This powers your calorie, macro, and water goals.
      </Text>

      <Text style={typography.heading}>Units</Text>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
        <ChipSelect
          options={[
            { value: 'imperial', label: 'Pounds / Inches' },
            { value: 'metric', label: 'Kilograms / Centimeters' },
          ]}
          value={unitsPreference}
          onChange={setUnitsPreference}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Full name (optional)"
        placeholderTextColor={colors.textMuted}
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={typography.heading}>Gender</Text>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
        <ChipSelect
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
          value={gender}
          onChange={setGender}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Date of birth (YYYY-MM-DD)"
        placeholderTextColor={colors.textMuted}
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
      />

      <TextInput
        style={styles.input}
        placeholder={heightLabel}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />

      <TextInput
        style={styles.input}
        placeholder={weightLabel}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <Text style={typography.heading}>Activity Level</Text>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
        <ChipSelect options={activityOptions} value={activityLevel} onChange={setActivityLevel} />
      </View>

      <Pressable style={styles.button} onPress={onContinue} disabled={upsertProfile.isPending}>
        <Text style={styles.buttonText}>{upsertProfile.isPending ? 'Saving…' : 'Continue'}</Text>
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
    marginBottom: spacing.xl,
  },
  buttonText: {
    color: colors.onAccent,
    fontWeight: '600',
    fontSize: 16,
  },
});
