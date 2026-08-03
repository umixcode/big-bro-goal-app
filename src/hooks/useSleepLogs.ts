import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSleepLogByDate, getSleepLogsForRange, upsertSleepLog } from '../api/sleepLogs';

export function useSleepLog(date: string) {
  return useQuery({ queryKey: ['sleepLog', date], queryFn: () => getSleepLogByDate(date) });
}

export type SleepDayStatus = 'met' | 'partial';

export function useSleepMonth(monthKey: string, sleepGoalHours: number) {
  const start = dayjs(`${monthKey}-01`).startOf('month').format('YYYY-MM-DD');
  const end = dayjs(`${monthKey}-01`).endOf('month').format('YYYY-MM-DD');

  const query = useQuery({
    queryKey: ['sleepLog', 'range', start, end],
    queryFn: () => getSleepLogsForRange(start, end),
  });

  const statusByDate = useMemo(() => {
    const map = new Map<string, SleepDayStatus>();
    for (const log of query.data ?? []) {
      if (log.total_minutes <= 0) continue;
      const ratio = sleepGoalHours > 0 ? log.total_minutes / (sleepGoalHours * 60) : 0;
      map.set(log.date, ratio >= 1 ? 'met' : 'partial');
    }
    return map;
  }, [query.data, sleepGoalHours]);

  return { ...query, statusByDate };
}

export function useUpsertSleepLog(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Parameters<typeof upsertSleepLog>[0], 'date'>) => upsertSleepLog({ date, ...input }),
    onSuccess: (data) => queryClient.setQueryData(['sleepLog', date], data),
  });
}
