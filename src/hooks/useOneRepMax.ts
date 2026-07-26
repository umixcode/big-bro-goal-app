import { useQuery } from '@tanstack/react-query';
import { BENCH_PRESS_EXERCISE_NAME, getCurrentOneRepMax, listOneRepMaxHistory } from '../api/oneRepMax';

export function useCurrentOneRepMax(exerciseName: string = BENCH_PRESS_EXERCISE_NAME) {
  return useQuery({
    queryKey: ['oneRepMax', 'current', exerciseName],
    queryFn: () => getCurrentOneRepMax(exerciseName),
  });
}

export function useOneRepMaxHistory(exerciseName: string = BENCH_PRESS_EXERCISE_NAME) {
  return useQuery({
    queryKey: ['oneRepMax', 'history', exerciseName],
    queryFn: () => listOneRepMaxHistory(exerciseName),
  });
}
