import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLoggedSet,
  getPreviousTopSet,
  listSetsForSession,
  type CreateLoggedSetInput,
  type LoggedSet,
} from '../api/loggedSets';
import { maybeRecordOneRepMax, BENCH_PRESS_EXERCISE_NAME, type OneRepMaxLog } from '../api/oneRepMax';

export function useSessionSets(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['loggedSets', sessionId],
    queryFn: () => listSetsForSession(sessionId as string),
    enabled: !!sessionId,
  });
}

export function usePreviousTopSet(exerciseName: string, excludeSessionId?: string) {
  return useQuery({
    queryKey: ['previousTopSet', exerciseName, excludeSessionId],
    queryFn: () => getPreviousTopSet(exerciseName, excludeSessionId),
    enabled: !!exerciseName,
  });
}

export interface CreateSetResult {
  loggedSet: LoggedSet;
  newOneRepMax: OneRepMaxLog | null;
}

export function useCreateLoggedSet(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CreateLoggedSetInput, 'session_id'>): Promise<CreateSetResult> => {
      const loggedSet = await createLoggedSet({ ...input, session_id: sessionId });
      let newOneRepMax: OneRepMaxLog | null = null;
      if (!input.is_warmup && input.exercise_name === BENCH_PRESS_EXERCISE_NAME) {
        newOneRepMax = await maybeRecordOneRepMax({
          sourceSetId: loggedSet.id,
          exerciseName: input.exercise_name,
          weight: input.weight,
          weightUnit: input.weight_unit,
          reps: input.reps,
        });
      }
      return { loggedSet, newOneRepMax };
    },
    onSuccess: ({ loggedSet }) => {
      queryClient.invalidateQueries({ queryKey: ['loggedSets', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['exerciseHistory', loggedSet.exercise_name] });
      queryClient.invalidateQueries({ queryKey: ['previousTopSet', loggedSet.exercise_name] });
      queryClient.invalidateQueries({ queryKey: ['oneRepMax'] });
    },
  });
}
