import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endSession, getOrCreateTodaysSession } from '../api/workoutSessions';

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
