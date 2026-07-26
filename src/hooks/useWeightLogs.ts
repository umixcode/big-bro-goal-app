import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listWeightLogs, upsertWeightLog } from '../api/weightLogs';

export function useWeightLogs(limit = 14) {
  return useQuery({ queryKey: ['weightLogs', limit], queryFn: () => listWeightLogs(limit) });
}

export function useUpsertWeightLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; weight_kg: number; source?: 'healthkit' | 'manual' }) => upsertWeightLog(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weightLogs'] }),
  });
}
