import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createJournalEntry, listJournalEntries } from '../api/journal';

export function useJournalEntries() {
  return useQuery({ queryKey: ['journalEntries'], queryFn: () => listJournalEntries() });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { content: string; mood_score?: number | null }) => createJournalEntry(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journalEntries'] }),
  });
}
