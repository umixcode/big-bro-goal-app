import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { useUserGoals } from './useUserGoals';
import {
  ageFromDateOfBirth,
  calculateBMR,
  calculateCalorieGoal,
  calculateMacroGoals,
  calculateTDEE,
  calculateWaterGoalMl,
} from '../lib/formulas';

export interface DailyTargets {
  calorieGoal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  waterGoalMl: number;
  sleepGoalHours: number;
}

export function useDailyTargets(): { targets: DailyTargets | null; isLoading: boolean } {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: goals, isLoading: goalsLoading } = useUserGoals();

  const targets = useMemo<DailyTargets | null>(() => {
    if (!profile || !goals) return null;
    if (!profile.gender || !profile.date_of_birth || !profile.height_cm || !profile.current_weight_kg) return null;

    const desiredWeightKg = goals.desired_weight_kg ?? profile.current_weight_kg;
    const age = ageFromDateOfBirth(profile.date_of_birth);
    const bmr = calculateBMR(profile.gender, profile.current_weight_kg, profile.height_cm, age);
    const tdee = calculateTDEE(bmr, profile.activity_level);
    const calorieGoal =
      goals.calorie_goal_override ??
      calculateCalorieGoal({
        tdee,
        currentWeightKg: profile.current_weight_kg,
        desiredWeightKg,
        targetDate: goals.target_date,
        gender: profile.gender,
      });
    const macros = calculateMacroGoals(calorieGoal, desiredWeightKg);

    return {
      calorieGoal,
      proteinG: goals.protein_goal_override_g ?? macros.proteinG,
      fatG: goals.fat_goal_override_g ?? macros.fatG,
      carbsG: goals.carbs_goal_override_g ?? macros.carbsG,
      waterGoalMl: goals.water_goal_override_ml ?? calculateWaterGoalMl(desiredWeightKg, profile.activity_level),
      sleepGoalHours: goals.sleep_goal_hours,
    };
  }, [profile, goals]);

  return { targets, isLoading: profileLoading || goalsLoading };
}
