import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSleepLogByDate, getSleepLogsForRange, upsertSleepLog } from '../api/sleepLogs';
import { buildHeatmapDays } from '../lib/goalHeatmap';

export function useSleepLog(date: string) {
  return useQuery({ queryKey: ['sleepLog', date], queryFn: () => getSleepLogByDate(date) });
}

const HEATMAP_DAYS = 84;

export function useSleepHeatmap(sleepGoalHours: number) {
  const end = dayjs().format('YYYY-MM-DD');
  const start = dayjs().subtract(HEATMAP_DAYS - 1, 'day').format('YYYY-MM-DD');

  const query = useQuery({
    queryKey: ['sleepLog', 'range', start, end],
    queryFn: () => getSleepLogsForRange(start, end),
  });

  const days = useMemo(() => {
    const totals = new Map((query.data ?? []).map((log) => [log.date, log.total_minutes]));
    return buildHeatmapDays(totals, (total) => total >= sleepGoalHours * 60, HEATMAP_DAYS);
  }, [query.data, sleepGoalHours]);

  return { ...query, days };
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
