import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStepsLogByDate, upsertStepsLog } from '../api/stepsLogs';

export function useStepsLog(date: string) {
  return useQuery({ queryKey: ['stepsLog', date], queryFn: () => getStepsLogByDate(date) });
}

export function useUpsertStepsLog(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { steps: number; source?: 'healthkit' | 'manual' }) => upsertStepsLog({ date, ...input }),
    onSuccess: (data) => queryClient.setQueryData(['stepsLog', date], data),
  });
}
