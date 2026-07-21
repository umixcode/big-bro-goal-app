/**
 * Idempotent import of the Phase 1 PPL + Upper/Lower workout program into Supabase.
 * Uses the service-role key (bypasses RLS) — never run this from the app itself.
 *
 * Usage: npm run import:workout-program
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface RawExercise {
  exercise: string;
  lastSetIntensityTechnique: string;
  warmUpSets: string;
  workingSets: number;
  reps: string;
  earlySetRPE: string;
  lastSetRPE: number | string;
  rest: string;
  substitutionOption1: string;
  substitutionOption2: string;
  notes: string;
}

interface RawDay {
  day: string;
  exercises: RawExercise[];
}

interface RawProgram {
  workoutProgram: RawDay[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function main() {
  const jsonPath = join(__dirname, '..', 'data', 'workout_program.json');
  const raw: RawProgram = JSON.parse(readFileSync(jsonPath, 'utf-8'));

  const { data: program, error: programError } = await supabase
    .from('workout_programs')
    .upsert(
      {
        name: 'PPL + Upper/Lower Hypertrophy/Strength Block',
        split_type: 'ppl_upper_lower',
        description: 'Push/Pull/Legs (hypertrophy) + Upper/Lower (strength) 5-day block.',
      },
      { onConflict: 'name' }
    )
    .select()
    .single();
  if (programError) throw programError;

  const { data: phase, error: phaseError } = await supabase
    .from('workout_phases')
    .upsert(
      {
        program_id: program.id,
        phase_number: 1,
        name: 'Phase 1',
        notes: '6-week phase.',
      },
      { onConflict: 'program_id,phase_number' }
    )
    .select()
    .single();
  if (phaseError) throw phaseError;

  for (const [dayIndex, day] of raw.workoutProgram.entries()) {
    const { data: phaseDay, error: dayError } = await supabase
      .from('workout_phase_days')
      .upsert(
        {
          phase_id: phase.id,
          day_key: slugify(day.day),
          day_name: day.day,
          day_order: dayIndex,
        },
        { onConflict: 'phase_id,day_order' }
      )
      .select()
      .single();
    if (dayError) throw dayError;

    for (const [exerciseIndex, exercise] of day.exercises.entries()) {
      const { error: exerciseError } = await supabase.from('workout_phase_exercises').upsert(
        {
          phase_day_id: phaseDay.id,
          exercise_order: exerciseIndex,
          exercise_name: exercise.exercise,
          last_set_intensity_technique: exercise.lastSetIntensityTechnique,
          warm_up_sets: exercise.warmUpSets,
          working_sets: exercise.workingSets,
          reps_range: exercise.reps,
          early_set_rpe: String(exercise.earlySetRPE),
          last_set_rpe: String(exercise.lastSetRPE),
          rest: exercise.rest,
          substitution_option_1: exercise.substitutionOption1,
          substitution_option_2: exercise.substitutionOption2,
          notes: exercise.notes,
        },
        { onConflict: 'phase_day_id,exercise_order' }
      );
      if (exerciseError) throw exerciseError;
    }

    console.log(`Imported "${day.day}" — ${day.exercises.length} exercises.`);
  }

  console.log('Workout program import complete.');
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
