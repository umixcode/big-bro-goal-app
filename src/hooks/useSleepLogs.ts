import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSleepLogByDate, upsertSleepLog } from '../api/sleepLogs';

export function useSleepLog(date: string) {
  return useQuery({ queryKey: ['sleepLog', date], queryFn: () => getSleepLogByDate(date) });
}

export function useUpsertSleepLog(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      total_minutes: number;
      score?: number | null;
      rem_minutes?: number | null;
      light_minutes?: number | null;
      deep_minutes?: number | null;
      awake_minutes?: number | null;
      start_time?: string | null;
      end_time?: string | null;
      source?: 'healthkit' | 'manual';
    }) => upsertSleepLog({ date, ...input }),
    onSuccess: (data) => queryClient.setQueryData(['sleepLog', date], data),
  });
}
