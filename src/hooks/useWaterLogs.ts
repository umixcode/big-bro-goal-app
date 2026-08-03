import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWaterLog, deleteWaterLog, getWaterLogsForRange, listWaterLogsByDate } from '../api/waterLogs';
import { buildHeatmapDays, sumByDate } from '../lib/goalHeatmap';

export function useWaterLogs(date: string) {
  const query = useQuery({ queryKey: ['waterLogs', date], queryFn: () => listWaterLogsByDate(date) });
  const totalMl = useMemo(() => (query.data ?? []).reduce((sum, log) => sum + log.amount_ml, 0), [query.data]);
  return { ...query, totalMl };
}

const HEATMAP_DAYS = 84;

export function useWaterHeatmap(waterGoalMl: number) {
  const end = dayjs().format('YYYY-MM-DD');
  const start = dayjs().subtract(HEATMAP_DAYS - 1, 'day').format('YYYY-MM-DD');

  const query = useQuery({
    queryKey: ['waterLogs', 'range', start, end],
    queryFn: () => getWaterLogsForRange(start, end),
  });

  const days = useMemo(() => {
    const totals = sumByDate((query.data ?? []).map((log) => ({ date: log.date, amount: log.amount_ml })));
    return buildHeatmapDays(totals, (total) => total >= waterGoalMl, HEATMAP_DAYS);
  }, [query.data, waterGoalMl]);

  return { ...query, days };
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
