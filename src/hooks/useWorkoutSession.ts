import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  endSession,
  getLastCompletedDay,
  getMonthSummary,
  getOrCreateTodaysSession,
  getPhaseDayCompletion,
  getSessionsForDate,
  getStreak,
  getWeekSummary,
} from '../api/workoutSessions';

export function useTodaysSession(phaseDayId: string | undefined) {
  return useQuery({
    queryKey: ['workoutSession', 'today', phaseDayId],
    queryFn: () => getOrCreateTodaysSession(phaseDayId as string),
    enabled: !!phaseDayId,
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workoutSession'] }),
  });
}

export function useWeekSummary() {
  return useQuery({
    queryKey: ['workoutSession', 'weekSummary'],
    queryFn: getWeekSummary,
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ['workoutSession', 'streak'],
    queryFn: getStreak,
  });
}

export function useLastCompletedDay() {
  return useQuery({
    queryKey: ['workoutSession', 'lastCompletedDay'],
    queryFn: getLastCompletedDay,
  });
}

export function useMonthSummary(monthKey: string) {
  return useQuery({
    queryKey: ['workoutSession', 'monthSummary', monthKey],
    queryFn: () => getMonthSummary(monthKey),
  });
}

export function usePhaseDayCompletion(phaseDayIds: string[]) {
  return useQuery({
    queryKey: ['workoutSession', 'phaseDayCompletion', ...phaseDayIds],
    queryFn: () => getPhaseDayCompletion(phaseDayIds),
    enabled: phaseDayIds.length > 0,
  });
}

export function useSessionsForDate(date: string | undefined) {
  return useQuery({
    queryKey: ['workoutSession', 'sessionsForDate', date],
    queryFn: () => getSessionsForDate(date as string),
    enabled: !!date,
  });
}
