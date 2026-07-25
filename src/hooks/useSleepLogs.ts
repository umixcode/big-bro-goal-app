import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSleepLogByDate, upsertSleepLog } from '../api/sleepLogs';

export function useSleepLog(date: string) {
  return useQuery({ queryKey: ['sleepLog', date], queryFn: () => getSleepLogByDate(date) });
}

export function useUpsertSleepLog(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { total_minutes: number; score?: number | null }) => upsertSleepLog({ date, ...input }),
    onSuccess: (data) => queryClient.setQueryData(['sleepLog', date], data),
  });
}
