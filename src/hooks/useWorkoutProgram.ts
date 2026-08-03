import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDefaultPhase, listPhaseDayExercises, listPhaseDays, swapPhaseExercise } from '../api/workoutPrograms';

// The program (phase/days/exercises) barely ever changes, so it's kept
// fresh for an hour and, more importantly, kept in the cache for a month —
// long enough to survive the persisted-cache restore on every app launch,
// which is what lets today's workout render instantly with no network
// round trip instead of a loading spinner.
const PROGRAM_STALE_TIME = 1000 * 60 * 60;
const PROGRAM_GC_TIME = 1000 * 60 * 60 * 24 * 30;

export function useDefaultPhase() {
  return useQuery({
    queryKey: ['workoutPhase', 'default'],
    queryFn: getDefaultPhase,
    staleTime: PROGRAM_STALE_TIME,
    gcTime: PROGRAM_GC_TIME,
  });
}

export function usePhaseDays(phaseId: string | undefined) {
  return useQuery({
    queryKey: ['workoutPhaseDays', phaseId],
    queryFn: () => listPhaseDays(phaseId as string),
    enabled: !!phaseId,
    staleTime: PROGRAM_STALE_TIME,
    gcTime: PROGRAM_GC_TIME,
  });
}

export function usePhaseDayExercises(phaseDayId: string | undefined) {
  return useQuery({
    queryKey: ['workoutPhaseExercises', phaseDayId],
    queryFn: () => listPhaseDayExercises(phaseDayId as string),
    enabled: !!phaseDayId,
    staleTime: PROGRAM_STALE_TIME,
    gcTime: PROGRAM_GC_TIME,
  });
}

export function useSwapPhaseExercise(phaseDayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      phaseExerciseId,
      newExerciseName,
      originalExerciseName,
    }: {
      phaseExerciseId: string;
      newExerciseName: string;
      originalExerciseName: string;
    }) => swapPhaseExercise(phaseExerciseId, newExerciseName, originalExerciseName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPhaseExercises', phaseDayId] });
    },
  });
}
