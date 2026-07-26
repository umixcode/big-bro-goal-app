import { useQuery } from '@tanstack/react-query';
import { getDefaultPhase, listPhaseDayExercises, listPhaseDays } from '../api/workoutPrograms';

export function useDefaultPhase() {
  return useQuery({ queryKey: ['workoutPhase', 'default'], queryFn: getDefaultPhase });
}

export function usePhaseDays(phaseId: string | undefined) {
  return useQuery({
    queryKey: ['workoutPhaseDays', phaseId],
    queryFn: () => listPhaseDays(phaseId as string),
    enabled: !!phaseId,
  });
}

export function usePhaseDayExercises(phaseDayId: string | undefined) {
  return useQuery({
    queryKey: ['workoutPhaseExercises', phaseDayId],
    queryFn: () => listPhaseDayExercises(phaseDayId as string),
    enabled: !!phaseDayId,
  });
}
