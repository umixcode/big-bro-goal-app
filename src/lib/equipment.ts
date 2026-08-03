export type EquipmentType = 'machine' | 'cable' | null;

// The program draws from a closed set of exercise names (data/workout_program.json
// plus their substitution options), so this list is curated against that set rather
// than guessed purely from keywords. Names with an obvious "machine"/"cable" keyword
// are covered by the fallback below even if omitted here.
const CABLE_EXERCISES = new Set([
  '1-arm 45° cable rear delt flye',
  'bayesian cable curl',
  'bottom-half seated cable flye',
  'cable crossover ladder',
  'cable crunch',
  'cable hip abduction',
  'cable hip adduction',
  'cable paused shrug-in',
  'cable shoulder press',
  'cable triceps kickback',
  'dual-handle lat pulldown',
  'ez-bar cable curl',
  'high-cable cuffed lateral raise',
  'high-cable lateral raise',
  'low-to-high cable crossover',
  'neutral-grip lat pulldown',
  'neutral-grip seated cable row',
  'overhead cable triceps extension (bar)',
  'overhead cable triceps extension (rope)',
  'rope face pull',
  'seated super-bayesian high cable curl',
  'wide-grip lat pulldown',
  'helms row',
]);

const MACHINE_EXERCISES = new Set([
  '45° incline machine press',
  'chest-supported machine row',
  'leg extension',
  'leg press',
  'leg press calf press',
  'lying leg curl',
  'seated leg curl',
  'machine chest press',
  'machine crunch',
  'machine hip abduction',
  'machine hip adduction',
  'machine preacher curl',
  'machine shoulder press',
  'machine shrug',
  'pec deck',
  'reverse pec deck',
  'seated calf raise',
  'smith machine row',
  'smith machine squat',
  'smith machine static lunge',
  'standing calf raise',
]);

export function classifyEquipment(exerciseName: string): EquipmentType {
  const name = exerciseName.trim().toLowerCase();
  if (CABLE_EXERCISES.has(name) || name.includes('cable')) return 'cable';
  if (MACHINE_EXERCISES.has(name) || name.includes('machine') || name.includes('pec deck')) return 'machine';
  return null;
}
