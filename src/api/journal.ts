import { File } from 'expo-file-system';
import dayjs from 'dayjs';
import { supabase } from './supabaseClient';

const BUCKET = 'journal-photos';

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_at: string;
  entry_date: string;
  photo_path: string;
}

// Scoped to the exact local date rather than paging through a capped
// "recent entries" list — a fixed limit would eventually stop finding
// older dates' entries once enough days had photos.
export async function getJournalEntryForDate(date: string): Promise<JournalEntry | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('entry_date', date)
    .not('photo_path', 'is', null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// journal-photos is a private bucket, so a photo is only ever viewable
// through a short-lived signed URL requested by its owner.
export async function getJournalPhotoUrl(photoPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(photoPath, 60 * 60);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

// One photo per calendar date — the path itself is keyed by date, so a
// second capture for a date that already has one fails the upload (no
// upsert) before it ever reaches the "no more than one a day" DB constraint.
export async function createJournalPhotoEntry(input: { uri: string; date: string }): Promise<JournalEntry> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const path = `${userData.user.id}/${input.date}.jpg`;
  const file = new File(input.uri);
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userData.user.id,
      entry_at: new Date().toISOString(),
      entry_date: input.date,
      photo_path: path,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// One batched signed-URL request for every photo in the month, rather than
// one request per day cell — keeps a full month's calendar to a single
// storage round trip.
export async function getJournalPhotosForMonth(monthKey: string): Promise<Record<string, string>> {
  const monthStart = dayjs(`${monthKey}-01`);
  const start = monthStart.format('YYYY-MM-DD');
  const end = monthStart.endOf('month').format('YYYY-MM-DD');

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return {};

  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('entry_date, photo_path')
    .eq('user_id', userData.user.id)
    .gte('entry_date', start)
    .lte('entry_date', end)
    .not('photo_path', 'is', null);
  if (error) throw error;
  if (!entries || entries.length === 0) return {};

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      entries.map((e) => e.photo_path),
      60 * 60
    );
  if (signError) throw signError;

  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  const photosByDate: Record<string, string> = {};
  for (const entry of entries) {
    const url = urlByPath.get(entry.photo_path);
    if (url) photosByDate[entry.entry_date] = url;
  }
  return photosByDate;
}

export async function deleteJournalEntry(id: string, photoPath: string): Promise<void> {
  // The storage path is keyed by date, so if this silently failed to
  // remove, the orphaned file would block ever recapturing that date
  // (upload uses upsert: false) even though the DB row looks deleted.
  // Surface it instead of deleting the row out from under a still-blocked
  // path.
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([photoPath]);
  if (storageError) throw storageError;

  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw error;
}
