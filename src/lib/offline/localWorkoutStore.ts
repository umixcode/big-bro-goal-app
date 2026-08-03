import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSession } from '../../api/workoutSessions';
import type { LoggedSet } from '../../api/loggedSets';

// On-device mirror of "today's session" state, keyed by session id, plus a
// (user, phase day, date) index so getOrCreateTodaysSession can resolve
// straight from disk without a network round trip. This is the source of
// truth the UI reads from while a session is still offline/unsynced.

const SESSIONS_KEY = '@offline/sessions';
const SETS_KEY = '@offline/sets';

interface SessionsBlob {
  byId: Record<string, WorkoutSession>;
  byKey: Record<string, string>;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function sessionLookupKey(userId: string, phaseDayId: string, date: string): string {
  return `${userId}|${phaseDayId}|${date}`;
}

export async function getSessionByKey(key: string): Promise<WorkoutSession | null> {
  const blob = await readJson<SessionsBlob>(SESSIONS_KEY, { byId: {}, byKey: {} });
  const id = blob.byKey[key];
  return id ? (blob.byId[id] ?? null) : null;
}

export async function getSessionById(id: string): Promise<WorkoutSession | null> {
  const blob = await readJson<SessionsBlob>(SESSIONS_KEY, { byId: {}, byKey: {} });
  return blob.byId[id] ?? null;
}

export async function saveSession(session: WorkoutSession, key?: string): Promise<void> {
  const blob = await readJson<SessionsBlob>(SESSIONS_KEY, { byId: {}, byKey: {} });
  blob.byId[session.id] = session;
  if (key) blob.byKey[key] = session.id;
  await writeJson(SESSIONS_KEY, blob);
}

export async function updateSession(id: string, patch: Partial<WorkoutSession>): Promise<WorkoutSession | null> {
  const blob = await readJson<SessionsBlob>(SESSIONS_KEY, { byId: {}, byKey: {} });
  const existing = blob.byId[id];
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  blob.byId[id] = updated;
  await writeJson(SESSIONS_KEY, blob);
  return updated;
}

export async function getSetsForSession(sessionId: string): Promise<LoggedSet[]> {
  const blob = await readJson<Record<string, LoggedSet[]>>(SETS_KEY, {});
  return blob[sessionId] ?? [];
}

export async function replaceSetsForSession(sessionId: string, sets: LoggedSet[]): Promise<void> {
  const blob = await readJson<Record<string, LoggedSet[]>>(SETS_KEY, {});
  blob[sessionId] = sets;
  await writeJson(SETS_KEY, blob);
}

export async function addSet(set: LoggedSet): Promise<void> {
  const blob = await readJson<Record<string, LoggedSet[]>>(SETS_KEY, {});
  const list = blob[set.session_id] ?? [];
  blob[set.session_id] = [...list, set];
  await writeJson(SETS_KEY, blob);
}

export async function removeSet(id: string, sessionId: string): Promise<void> {
  const blob = await readJson<Record<string, LoggedSet[]>>(SETS_KEY, {});
  const list = blob[sessionId];
  if (!list) return;
  blob[sessionId] = list.filter((s) => s.id !== id);
  await writeJson(SETS_KEY, blob);
}
