import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMachineSettings, saveMachineSettings } from '../api/machineSettings';

export function useMachineSettings(exerciseName: string, enabled = true) {
  return useQuery({
    queryKey: ['machineSettings', exerciseName],
    queryFn: () => getMachineSettings(exerciseName),
    enabled: !!exerciseName && enabled,
  });
}

export function useSaveMachineSettings(exerciseName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { height: string | null; width: string | null }) =>
      saveMachineSettings({ exercise_name: exerciseName, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machineSettings', exerciseName] });
    },
  });
}
