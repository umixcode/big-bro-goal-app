import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFoodEntry, deleteFoodEntry, listFoodEntriesByDate } from '../api/foodEntries';

export function useFoodEntries(date: string) {
  return useQuery({ queryKey: ['foodEntries', date], queryFn: () => listFoodEntriesByDate(date) });
}

export function useCreateFoodEntry(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Parameters<typeof createFoodEntry>[0], 'date'>) => createFoodEntry({ date, ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foodEntries', date] }),
  });
}

export function useDeleteFoodEntry(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFoodEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foodEntries', date] }),
  });
}
