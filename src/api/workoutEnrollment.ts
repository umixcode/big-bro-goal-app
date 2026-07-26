import { supabase } from './supabaseClient';

export interface WorkoutEnrollment {
  id: string;
  user_id: string;
  phase_id: string;
  started_at: string;
  is_active: boolean;
}

export async function getActiveEnrollment(): Promise<WorkoutEnrollment | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('user_program_enrollments')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Fetch-or-create: there is exactly one active enrollment per user (enforced by
// a partial unique index), so a concurrent insert can race and 23505. In that
// case another call already won — just fetch and return its result.
export async function ensureActiveEnrollment(phaseId: string): Promise<WorkoutEnrollment> {
  const existing = await getActiveEnrollment();
  if (existing) return existing;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('user_program_enrollments')
    .insert({ user_id: userData.user.id, phase_id: phaseId })
    .select()
    .single();

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      const winner = await getActiveEnrollment();
      if (winner) return winner;
    }
    throw error;
  }
  return data;
}
