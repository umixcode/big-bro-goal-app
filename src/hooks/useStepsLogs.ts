import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStepsLogByDate, getStepsLogsForRange, upsertStepsLog, type StepsLog } from '../api/stepsLogs';

export function useStepsLog(date: string) {
  return useQuery({ queryKey: ['stepsLog', date], queryFn: () => getStepsLogByDate(date) });
}

export interface StepsWeekDay {
  date: string;
  log: StepsLog | null;
  met: boolean;
}

const WEEK_DAYS = 7;

export function useStepsWeek(stepGoal: number) {
  const end = dayjs().format('YYYY-MM-DD');
  const start = dayjs().subtract(WEEK_DAYS - 1, 'day').format('YYYY-MM-DD');

  const query = useQuery({
    queryKey: ['stepsLog', 'range', start, end],
    queryFn: () => getStepsLogsForRange(start, end),
  });

  const byDate = useMemo(() => new Map((query.data ?? []).map((log) => [log.date, log])), [query.data]);

  const days = useMemo<StepsWeekDay[]>(
    () =>
      Array.from({ length: WEEK_DAYS }, (_, i) => {
        const date = dayjs().subtract(WEEK_DAYS - 1 - i, 'day').format('YYYY-MM-DD');
        const log = byDate.get(date) ?? null;
        return { date, log, met: (log?.steps ?? 0) >= stepGoal };
      }),
    [byDate, stepGoal]
  );

  return { ...query, days, byDate };
}

export function useUpsertStepsLog(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Parameters<typeof upsertStepsLog>[0], 'date'>) => upsertStepsLog({ date, ...input }),
    onSuccess: (data) => queryClient.setQueryData(['stepsLog', date], data),
  });
}
