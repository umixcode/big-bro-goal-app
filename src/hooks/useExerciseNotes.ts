import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getExerciseNote, saveExerciseNote } from '../api/exerciseNotes';

export function useExerciseNote(exerciseName: string) {
  return useQuery({
    queryKey: ['exerciseNote', exerciseName],
    queryFn: () => getExerciseNote(exerciseName),
    enabled: !!exerciseName,
  });
}

export function useSaveExerciseNote(exerciseName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes: string | null) => saveExerciseNote(exerciseName, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseNote', exerciseName] });
    },
  });
}
