import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPlannerTask,
  deletePlannerTask,
  listPlannerTasks,
  togglePlannerTask,
} from '../api/planner';

export function usePlannerTasks(date: string) {
  return useQuery({ queryKey: ['plannerTasks', date], queryFn: () => listPlannerTasks(date) });
}

function useInvalidatePlannerTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['plannerTasks'] });
}

export function useCreatePlannerTask() {
  const invalidate = useInvalidatePlannerTasks();
  return useMutation({
    mutationFn: (input: { date: string; title: string }) => createPlannerTask(input),
    onSuccess: invalidate,
  });
}

export function useTogglePlannerTask() {
  const invalidate = useInvalidatePlannerTasks();
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) => togglePlannerTask(id, isCompleted),
    onSuccess: invalidate,
  });
}

export function useDeletePlannerTask() {
  const invalidate = useInvalidatePlannerTasks();
  return useMutation({
    mutationFn: (id: string) => deletePlannerTask(id),
    onSuccess: invalidate,
  });
}
