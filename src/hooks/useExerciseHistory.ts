import { useQuery } from '@tanstack/react-query';
import { listExerciseHistory } from '../api/loggedSets';
import { groupSessionsByDate } from '../lib/workoutStats';

export function useExerciseHistory(exerciseName: string) {
  return useQuery({
    queryKey: ['exerciseHistory', exerciseName],
    queryFn: () => listExerciseHistory(exerciseName),
    enabled: !!exerciseName,
    select: groupSessionsByDate,
  });
}
