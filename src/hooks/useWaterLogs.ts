import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWaterLog, deleteWaterLog, listWaterLogsByDate } from '../api/waterLogs';

export function useWaterLogs(date: string) {
  const query = useQuery({ queryKey: ['waterLogs', date], queryFn: () => listWaterLogsByDate(date) });
  const totalMl = useMemo(() => (query.data ?? []).reduce((sum, log) => sum + log.amount_ml, 0), [query.data]);
  return { ...query, totalMl };
}

export function useAddWaterLog(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount_ml: number) => addWaterLog({ date, amount_ml }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waterLogs', date] }),
  });
}

export function useDeleteWaterLog(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWaterLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waterLogs', date] }),
  });
}
