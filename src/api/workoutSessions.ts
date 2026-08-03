import dayjs from 'dayjs';
import * as Crypto from 'expo-crypto';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabaseClient';
import * as localStore from '../lib/offline/localWorkoutStore';
import * as offlineQueue from '../lib/offline/queue';

export interface WorkoutSession {
  id: string;
  user_id: string;
  phase_day_id: string | null;
  session_date: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
}

// Fetch-or-create: resumes today's session for this day if one already
// exists — finished or not — otherwise starts a new one. Reusing a finished
// session (rather than spinning up a fresh one) is what lets "Finish
// workout" followed by reopening the same day show the sets you actually
// logged, so you can review/undo/adjust them instead of landing on a blank
// slate that looks like the workout was never done.
//
// This is local-first: the on-device copy (keyed by user+phase day+date) is
// checked before ever touching the network, so resuming today's workout
// never waits on — or requires — connectivity. A brand new session is
// created locally immediately and queued for sync rather than blocked on a
// round trip; the server is only consulted to pick up a session that might
// already exist from another device, and a failure to reach it (offline)
// just falls through to creating the local one.
export async function getOrCreateTodaysSession(phaseDayId: string): Promise<WorkoutSession> {
  // getSession() reads the already-verified session straight out of local
  // secure storage — unlike getUser(), it never makes a network call, which
  // matters here since this needs to resolve before we've even checked
  // whether there's a local session to fall back on.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Not signed in');
  const userId = sessionData.session.user.id;
  const today = dayjs().format('YYYY-MM-DD');
  const key = localStore.sessionLookupKey(userId, phaseDayId, today);

  const local = await localStore.getSessionByKey(key);
  if (local) return local;

  // Skip the round trip entirely when we already know there's no
  // connectivity — no reason to sit through even a bounded timeout when the
  // answer is knowable up front. The fetchWithTimeout guard on the Supabase
  // client (5s) still covers the "reports connected but isn't really" case
  // this can't detect (e.g. Wi-Fi left on while offline).
  const netState = await NetInfo.fetch();
  const isOffline = netState.isConnected === false || netState.isInternetReachable === false;

  if (!isOffline) {
    try {
      const { data: existing, error: findError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('phase_day_id', phaseDayId)
        .eq('session_date', today)
        .order('started_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (findError) throw findError;
      if (existing) {
        await localStore.saveSession(existing, key);
        return existing;
      }
    } catch {
      // Offline (or otherwise unreachable) — fall through to a local-only
      // session rather than blocking on the network.
    }
  }

  const session: WorkoutSession = {
    id: Crypto.randomUUID(),
    user_id: userId,
    phase_day_id: phaseDayId,
    session_date: today,
    started_at: dayjs().toISOString(),
    ended_at: null,
    notes: null,
  };
  await localStore.saveSession(session, key);
  await offlineQueue.enqueue({ id: Crypto.randomUUID(), kind: 'insert_session', payload: session });
  offlineQueue.flush();
  return session;
}

export async function endSession(sessionId: string): Promise<WorkoutSession> {
  const ended_at = dayjs().toISOString();
  const updated = await localStore.updateSession(sessionId, { ended_at });
  if (!updated) throw new Error('Session not found locally');

  await offlineQueue.enqueue({
    id: Crypto.randomUUID(),
    kind: 'update_session',
    payload: { id: sessionId, patch: { ended_at } },
  });
  offlineQueue.flush();
  return updated;
}

export interface DaySummary {
  date: string;
  status: 'complete' | 'partial' | 'none';
}

function computeDayStatus(prescribed: number, logged: number): DaySummary['status'] {
  if (logged === 0) return 'none';
  return prescribed === 0 || logged >= prescribed ? 'complete' : 'partial';
}

// Shared by getWeekSummary/getStreak: for every session in [startDate,
// endDate], sums prescribed working sets (from that session's phase day) and
// logged non-warmup sets, per calendar date.
export interface SessionDayInfo {
  phaseDayId: string;
  dayName: string;
}

async function buildDateStatusMaps(
  userId: string,
  startDate: string,
  endDate: string
): Promise<{
  prescribedByDate: Map<string, number>;
  loggedByDate: Map<string, number>;
  sessionInfoByDate: Map<string, SessionDayInfo[]>;
}> {
  const prescribedByDate = new Map<string, number>();
  const loggedByDate = new Map<string, number>();
  const sessionInfoByDate = new Map<string, SessionDayInfo[]>();

  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select('id, phase_day_id, session_date')
    .eq('user_id', userId)
    .gte('session_date', startDate)
    .lte('session_date', endDate);
  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return { prescribedByDate, loggedByDate, sessionInfoByDate };

  const phaseDayIds = [...new Set(sessions.map((s) => s.phase_day_id).filter((id): id is string => !!id))];
  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_phase_exercises')
    .select('phase_day_id, working_sets')
    .in('phase_day_id', phaseDayIds);
  if (exercisesError) throw exercisesError;

  const { data: phaseDays, error: phaseDaysError } = await supabase
    .from('workout_phase_days')
    .select('id, day_name')
    .in('id', phaseDayIds);
  if (phaseDaysError) throw phaseDaysError;

  const dayNameByPhaseDayId = new Map((phaseDays ?? []).map((d) => [d.id, d.day_name as string]));

  const prescribedByPhaseDay = new Map<string, number>();
  for (const ex of exercises ?? []) {
    prescribedByPhaseDay.set(
      ex.phase_day_id,
      (prescribedByPhaseDay.get(ex.phase_day_id) ?? 0) + (ex.working_sets ?? 0)
    );
  }

  const sessionIds = sessions.map((s) => s.id);
  const { data: loggedSets, error: loggedSetsError } = await supabase
    .from('logged_sets')
    .select('session_id')
    .in('session_id', sessionIds)
    .eq('is_warmup', false);
  if (loggedSetsError) throw loggedSetsError;

  const loggedCountBySession = new Map<string, number>();
  for (const row of loggedSets ?? []) {
    loggedCountBySession.set(row.session_id, (loggedCountBySession.get(row.session_id) ?? 0) + 1);
  }

  // Prescribed totals are a property of the phase day, not of how many
  // session rows happen to exist for it — counting per session row would
  // double (or triple...) the prescribed total for a date that has more
  // than one session for the same phase day, making a genuinely finished
  // day look permanently partial.
  const countedPrescribedKeys = new Set<string>();

  for (const session of sessions) {
    const logged = loggedCountBySession.get(session.id) ?? 0;
    // A session row gets created the moment its screen is opened (fetch-or-
    // create), even if nothing ends up logged — e.g. tapping into "change
    // workout" to look, then backing out. Ignoring untouched sessions here
    // keeps them from inflating a date's prescribed total against a
    // completely different, actually-worked day.
    if (logged === 0) continue;

    const prescribed = session.phase_day_id ? (prescribedByPhaseDay.get(session.phase_day_id) ?? 0) : 0;
    const prescribedKey = `${session.session_date}|${session.phase_day_id ?? ''}`;
    if (session.phase_day_id && !countedPrescribedKeys.has(prescribedKey)) {
      countedPrescribedKeys.add(prescribedKey);
      prescribedByDate.set(session.session_date, (prescribedByDate.get(session.session_date) ?? 0) + prescribed);
    }
    loggedByDate.set(session.session_date, (loggedByDate.get(session.session_date) ?? 0) + logged);

    const dayName = session.phase_day_id ? dayNameByPhaseDayId.get(session.phase_day_id) : undefined;
    if (dayName && session.phase_day_id) {
      const list = sessionInfoByDate.get(session.session_date) ?? [];
      list.push({ phaseDayId: session.phase_day_id, dayName });
      sessionInfoByDate.set(session.session_date, list);
    }
  }

  return { prescribedByDate, loggedByDate, sessionInfoByDate };
}

// Day names (case-insensitive substring match) that trigger a rest day
// immediately after — the program schedules a rest day following Legs and
// following Lower.
const REST_DAY_TRIGGERS = ['legs', 'lower'];

export function nameTriggersRestDay(dayName: string): boolean {
  return REST_DAY_TRIGGERS.some((trigger) => dayName.toLowerCase().includes(trigger));
}

function completingGrantsRestDay(sessionInfo: SessionDayInfo[] | undefined): boolean {
  if (!sessionInfo) return false;
  return sessionInfo.some((info) => nameTriggersRestDay(info.dayName));
}

// Summarizes the current calendar week (Sun-Sat) for the week-progress row:
// for each day, compares sets logged against the sum of prescribed working
// sets across that day's session(s).
export async function getWeekSummary(): Promise<DaySummary[]> {
  const weekStart = dayjs().startOf('week');
  const dates = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day').format('YYYY-MM-DD'));

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return dates.map((date) => ({ date, status: 'none' as const }));

  const { prescribedByDate, loggedByDate } = await buildDateStatusMaps(
    userData.user.id,
    dates[0],
    dates[6]
  );

  return dates.map((date) => ({
    date,
    status: computeDayStatus(prescribedByDate.get(date) ?? 0, loggedByDate.get(date) ?? 0),
  }));
}

// Same idea as getWeekSummary but for every day in a given month, for the
// expanded month-streak calendar. monthKey is "YYYY-MM".
export async function getMonthSummary(monthKey: string): Promise<DaySummary[]> {
  const monthStart = dayjs(`${monthKey}-01`);
  const daysInMonth = monthStart.daysInMonth();
  const dates = Array.from({ length: daysInMonth }, (_, i) => monthStart.date(i + 1).format('YYYY-MM-DD'));

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return dates.map((date) => ({ date, status: 'none' as const }));

  const { prescribedByDate, loggedByDate } = await buildDateStatusMaps(
    userData.user.id,
    dates[0],
    dates[dates.length - 1]
  );

  return dates.map((date) => ({
    date,
    status: computeDayStatus(prescribedByDate.get(date) ?? 0, loggedByDate.get(date) ?? 0),
  }));
}

// Counts consecutive fully-completed calendar days ending today, walking
// backwards until a missed or partial day breaks the chain. A day that's
// merely in progress (partial/none so far) doesn't break the streak until
// it's actually over — it just isn't counted yet.
export async function getStreak(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;

  const lookbackDays = 400;
  const startDate = dayjs().subtract(lookbackDays, 'day').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');

  const { prescribedByDate, loggedByDate, sessionInfoByDate } = await buildDateStatusMaps(
    userData.user.id,
    startDate,
    today
  );
  const statusForDate = (date: string) =>
    computeDayStatus(prescribedByDate.get(date) ?? 0, loggedByDate.get(date) ?? 0);

  let streak = 0;
  let restDayAvailable = false;
  let cursor = dayjs();

  if (statusForDate(today) === 'complete') {
    streak += 1;
    restDayAvailable = completingGrantsRestDay(sessionInfoByDate.get(today));
  }
  cursor = cursor.subtract(1, 'day');

  for (let i = 0; i < lookbackDays; i++) {
    const date = cursor.format('YYYY-MM-DD');
    const status = statusForDate(date);

    if (status === 'complete') {
      streak += 1;
      restDayAvailable = completingGrantsRestDay(sessionInfoByDate.get(date));
      cursor = cursor.subtract(1, 'day');
      continue;
    }

    if (status === 'none' && restDayAvailable) {
      // Scheduled rest day right after Legs/Lower — doesn't break the
      // streak, and doesn't itself grant another rest day.
      restDayAvailable = false;
      cursor = cursor.subtract(1, 'day');
      continue;
    }

    break;
  }

  return streak;
}

export interface LastCompletedDay {
  phaseDayId: string;
  dayName: string;
  date: string;
}

// Most recent calendar date with a *finished* workout session (the user
// tapped "Finish workout"), used to figure out what today's assigned day in
// the rotation should be. This deliberately doesn't require every
// prescribed set to be logged — waiting for an exact logged >= prescribed
// count meant a session that ended one set short (or with a skipped
// exercise) never counted, so the rotation stayed stuck on the same day
// indefinitely. Finishing the session is the user's explicit signal that
// they did that day. (The stricter logged-vs-prescribed "complete" status
// is still used for the streak/calendar completeness visuals, which are a
// separate concept from rotation advancement.)
export async function getLastCompletedDay(): Promise<LastCompletedDay | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const lookbackDays = 60;
  const startDate = dayjs().subtract(lookbackDays, 'day').format('YYYY-MM-DD');

  const { data: session, error } = await supabase
    .from('workout_sessions')
    .select('phase_day_id, session_date')
    .eq('user_id', userData.user.id)
    .gte('session_date', startDate)
    .not('ended_at', 'is', null)
    .not('phase_day_id', 'is', null)
    .order('session_date', { ascending: false })
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!session?.phase_day_id) return null;

  const { data: phaseDay, error: phaseDayError } = await supabase
    .from('workout_phase_days')
    .select('day_name')
    .eq('id', session.phase_day_id)
    .maybeSingle();
  if (phaseDayError) throw phaseDayError;

  return { phaseDayId: session.phase_day_id, dayName: phaseDay?.day_name ?? '', date: session.session_date };
}

export interface SessionForDate {
  id: string;
  phaseDayId: string | null;
  dayName: string | null;
}

// All sessions logged on a specific calendar date, for the read-only
// "what did I do that day" view reached by tapping a past day in the month
// calendar.
export async function getSessionsForDate(date: string): Promise<SessionForDate[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, phase_day_id, workout_phase_days(day_name)')
    .eq('user_id', userData.user.id)
    .eq('session_date', date)
    .order('started_at', { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // A session row gets created the moment its screen is opened, even if
  // nothing ends up logged — filter those out so merely having looked at a
  // day doesn't make it read as "did a workout that day."
  const sessionIds = data.map((s) => s.id);
  const { data: loggedSets, error: loggedSetsError } = await supabase
    .from('logged_sets')
    .select('session_id')
    .in('session_id', sessionIds)
    .eq('is_warmup', false);
  if (loggedSetsError) throw loggedSetsError;

  const sessionsWithLoggedSets = new Set((loggedSets ?? []).map((row) => row.session_id));

  return data
    .filter((s) => sessionsWithLoggedSets.has(s.id))
    .map((s) => ({
      id: s.id,
      phaseDayId: s.phase_day_id,
      dayName: (s.workout_phase_days as unknown as { day_name: string } | null)?.day_name ?? null,
    }));
}

// For each phase day, whether its most recent session (if any) was fully
// completed — used to mark day tabs green once you've finished that day,
// independent of which calendar date it happened on.
export async function getPhaseDayCompletion(phaseDayIds: string[]): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  if (phaseDayIds.length === 0) return result;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return result;

  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select('id, phase_day_id, session_date')
    .eq('user_id', userData.user.id)
    .in('phase_day_id', phaseDayIds)
    .order('session_date', { ascending: false });
  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return result;

  const latestSessionByPhaseDay = new Map<string, { id: string }>();
  for (const session of sessions) {
    if (!session.phase_day_id || latestSessionByPhaseDay.has(session.phase_day_id)) continue;
    latestSessionByPhaseDay.set(session.phase_day_id, { id: session.id });
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_phase_exercises')
    .select('phase_day_id, working_sets')
    .in('phase_day_id', phaseDayIds);
  if (exercisesError) throw exercisesError;

  const prescribedByPhaseDay = new Map<string, number>();
  for (const ex of exercises ?? []) {
    prescribedByPhaseDay.set(
      ex.phase_day_id,
      (prescribedByPhaseDay.get(ex.phase_day_id) ?? 0) + (ex.working_sets ?? 0)
    );
  }

  const latestSessionIds = [...latestSessionByPhaseDay.values()].map((s) => s.id);
  const { data: loggedSets, error: loggedSetsError } = await supabase
    .from('logged_sets')
    .select('session_id')
    .in('session_id', latestSessionIds)
    .eq('is_warmup', false);
  if (loggedSetsError) throw loggedSetsError;

  const loggedCountBySession = new Map<string, number>();
  for (const row of loggedSets ?? []) {
    loggedCountBySession.set(row.session_id, (loggedCountBySession.get(row.session_id) ?? 0) + 1);
  }

  for (const phaseDayId of phaseDayIds) {
    const session = latestSessionByPhaseDay.get(phaseDayId);
    const prescribed = prescribedByPhaseDay.get(phaseDayId) ?? 0;
    const logged = session ? (loggedCountBySession.get(session.id) ?? 0) : 0;
    result[phaseDayId] = computeDayStatus(prescribed, logged) === 'complete';
  }

  return result;
}
