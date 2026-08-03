import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createActionTask,
  deleteActionTask,
  listActionTaskDates,
  listActionTasks,
  setActionTaskStatus,
  type ActionStatus,
} from '../api/actions';

export function useActionTasks(date: string) {
  return useQuery({ queryKey: ['actionTasks', date], queryFn: () => listActionTasks(date) });
}

export function useActionTaskDates(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['actionTasks', 'dates', startDate, endDate],
    queryFn: () => listActionTaskDates(startDate, endDate),
  });
}

function useInvalidateActionTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['actionTasks'] });
}

export function useCreateActionTask() {
  const invalidate = useInvalidateActionTasks();
  return useMutation({
    mutationFn: (input: { date: string; title: string }) => createActionTask(input),
    onSuccess: invalidate,
  });
}

export function useSetActionTaskStatus() {
  const invalidate = useInvalidateActionTasks();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionStatus | null }) => setActionTaskStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteActionTask() {
  const invalidate = useInvalidateActionTasks();
  return useMutation({
    mutationFn: (id: string) => deleteActionTask(id),
    onSuccess: invalidate,
  });
}
