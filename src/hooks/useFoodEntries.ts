import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFoodEntry, deleteFoodEntry, getFoodEntriesForRange, listFoodEntriesByDate } from '../api/foodEntries';
import { buildHeatmapDays, sumByDate } from '../lib/goalHeatmap';

export function useFoodEntries(date: string) {
  return useQuery({ queryKey: ['foodEntries', date], queryFn: () => listFoodEntriesByDate(date) });
}

const HEATMAP_DAYS = 84;
const GOAL_TOLERANCE = 0.1;

export function useFoodHeatmap(calorieGoal: number) {
  const end = dayjs().format('YYYY-MM-DD');
  const start = dayjs().subtract(HEATMAP_DAYS - 1, 'day').format('YYYY-MM-DD');

  const query = useQuery({
    queryKey: ['foodEntries', 'range', start, end],
    queryFn: () => getFoodEntriesForRange(start, end),
  });

  const days = useMemo(() => {
    const totals = sumByDate((query.data ?? []).map((entry) => ({ date: entry.date, amount: entry.calories })));
    return buildHeatmapDays(totals, (total) => Math.abs(total - calorieGoal) <= calorieGoal * GOAL_TOLERANCE, HEATMAP_DAYS);
  }, [query.data, calorieGoal]);

  return { ...query, days };
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
