import dayjs from 'dayjs';
import { supabase } from './supabaseClient';

export interface WorkoutSession {
  id: string;
  user_id: string;
  phase_day_id: string | null;
  session_date: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
}

// Fetch-or-create: resumes today's unfinished session for this day if one
// exists, otherwise starts a new one. If a prior session for this day was
// already finished today, a fresh session is started (allowed — e.g. a second
// accessory session on the same day).
export async function getOrCreateTodaysSession(phaseDayId: string): Promise<WorkoutSession> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');
  const today = dayjs().format('YYYY-MM-DD');

  const { data: existing, error: findError } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('phase_day_id', phaseDayId)
    .eq('session_date', today)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ user_id: userData.user.id, phase_day_id: phaseDayId, session_date: today })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function endSession(sessionId: string): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({ ended_at: dayjs().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
