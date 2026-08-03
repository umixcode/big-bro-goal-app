import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createJournalPhotoEntry,
  deleteJournalEntry,
  getJournalEntryForDate,
  getJournalPhotosForMonth,
  getJournalPhotoUrl,
} from '../api/journal';

export function useJournalEntryForDate(date: string) {
  return useQuery({ queryKey: ['journalEntry', date], queryFn: () => getJournalEntryForDate(date) });
}

export function useJournalPhotosForMonth(monthKey: string) {
  return useQuery({
    queryKey: ['journalEntry', 'month', monthKey],
    queryFn: () => getJournalPhotosForMonth(monthKey),
    staleTime: 30 * 60 * 1000,
  });
}

export function useJournalPhotoUrl(photoPath: string | undefined) {
  return useQuery({
    queryKey: ['journalPhotoUrl', photoPath],
    queryFn: () => getJournalPhotoUrl(photoPath as string),
    enabled: !!photoPath,
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreateJournalPhotoEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { uri: string; date: string }) => createJournalPhotoEntry(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journalEntry'] }),
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, photoPath }: { id: string; photoPath: string }) => deleteJournalEntry(id, photoPath),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journalEntry'] }),
  });
}
