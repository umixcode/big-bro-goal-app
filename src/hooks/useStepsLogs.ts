import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStepsLogByDate, getStepsLogsForRange, upsertStepsLog } from '../api/stepsLogs';
import { buildHeatmapDays } from '../lib/goalHeatmap';

export function useStepsLog(date: string) {
  return useQuery({ queryKey: ['stepsLog', date], queryFn: () => getStepsLogByDate(date) });
}

const HEATMAP_DAYS = 84;

export function useStepsHeatmap(stepGoal: number) {
  const end = dayjs().format('YYYY-MM-DD');
  const start = dayjs().subtract(HEATMAP_DAYS - 1, 'day').format('YYYY-MM-DD');

  const query = useQuery({
    queryKey: ['stepsLog', 'range', start, end],
    queryFn: () => getStepsLogsForRange(start, end),
  });

  const days = useMemo(() => {
    const totals = new Map((query.data ?? []).map((log) => [log.date, log.steps]));
    return buildHeatmapDays(totals, (total) => total >= stepGoal, HEATMAP_DAYS);
  }, [query.data, stepGoal]);

  return { ...query, days };
}

export function useUpsertStepsLog(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { steps: number; source?: 'healthkit' | 'manual' }) => upsertStepsLog({ date, ...input }),
    onSuccess: (data) => queryClient.setQueryData(['stepsLog', date], data),
  });
}
