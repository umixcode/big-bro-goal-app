import type { ActivityLevel, Gender } from '../api/profiles';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const KG_TO_LB = 2.20462262;
const KCAL_PER_KG_FAT = 7700;

export function calculateBMR(gender: Gender, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return gender === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function ageFromDateOfBirth(dateOfBirth: string, today: Date = new Date()): number {
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export interface CalorieGoalInput {
  tdee: number;
  currentWeightKg: number;
  desiredWeightKg: number;
  targetDate: string | null;
  gender: Gender;
  today?: Date;
}

const SAFE_MIN_CALORIES: Record<Gender, number> = { male: 1500, female: 1200 };

export function calculateCalorieGoal({
  tdee,
  currentWeightKg,
  desiredWeightKg,
  targetDate,
  gender,
  today = new Date(),
}: CalorieGoalInput): number {
  const weightDeltaKg = desiredWeightKg - currentWeightKg;
  let dailyAdjustment: number;

  if (targetDate) {
    const daysRemaining = Math.max(1, Math.ceil((new Date(targetDate).getTime() - today.getTime()) / 86_400_000));
    const rawAdjustment = (weightDeltaKg * KCAL_PER_KG_FAT) / daysRemaining;
    dailyAdjustment = Math.max(-1000, Math.min(500, rawAdjustment));
  } else if (Math.abs(weightDeltaKg) < 1) {
    dailyAdjustment = 0;
  } else if (weightDeltaKg < 0) {
    dailyAdjustment = -500;
  } else {
    dailyAdjustment = 300;
  }

  return Math.max(SAFE_MIN_CALORIES[gender], Math.round(tdee + dailyAdjustment));
}

export interface MacroGoals {
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export function calculateMacroGoals(calorieGoal: number, desiredWeightKg: number): MacroGoals {
  const desiredWeightLb = desiredWeightKg * KG_TO_LB;
  const proteinG = Math.round(desiredWeightLb * 1.0);
  const fatG = Math.round((calorieGoal * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calorieGoal - proteinG * 4 - fatG * 9) / 4));
  return { proteinG, fatG, carbsG };
}

export function calculateWaterGoalMl(desiredWeightKg: number, activityLevel: ActivityLevel): number {
  const base = desiredWeightKg * 35;
  const activityBonus = activityLevel === 'active' || activityLevel === 'very_active' ? 350 : 0;
  return Math.round(base + activityBonus);
}

export function calculateSleepScore(totalMinutesAsleep: number, sleepGoalHours: number): number {
  if (sleepGoalHours <= 0) return 0;
  const ratio = totalMinutesAsleep / (sleepGoalHours * 60);
  return Math.round(100 * Math.min(ratio, 1));
}

export function getStepsStatusMessage(steps: number, stepGoal: number, weeklyAvgSteps: number): string {
  if (stepGoal > 0 && steps >= stepGoal) return "Goal reached — you're crushing it today.";
  if (weeklyAvgSteps > 0 && steps >= weeklyAvgSteps) return "You're pacing ahead of your weekly average.";
  if (stepGoal <= 0) return 'Keep moving today.';
  const percent = Math.round((steps / stepGoal) * 100);
  return `Keep it up — you're at ${percent}% of your goal.`;
}

export function getSleepStatus(score: number): { label: string; message: string } {
  if (score >= 90) return { label: 'Excellent', message: 'You had a deeply restful night.' };
  if (score >= 75) return { label: 'Great', message: 'You had a restful night and your body is well rested.' };
  if (score >= 60) return { label: 'Good', message: 'A solid night, just a bit short of your goal.' };
  if (score >= 40) return { label: 'Fair', message: 'You came up short on sleep — try winding down earlier tonight.' };
  return { label: 'Poor', message: 'You got very little rest last night.' };
}

export function estimateOneRepMax(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}
