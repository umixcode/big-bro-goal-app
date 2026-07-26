import { useQuery } from '@tanstack/react-query';
import { listExerciseHistory } from '../api/loggedSets';
import { groupTopSetsByDate } from '../lib/workoutStats';

export function useExerciseHistory(exerciseName: string) {
  return useQuery({
    queryKey: ['exerciseHistory', exerciseName],
    queryFn: () => listExerciseHistory(exerciseName),
    enabled: !!exerciseName,
    select: groupTopSetsByDate,
  });
}
