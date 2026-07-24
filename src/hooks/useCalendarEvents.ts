import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEvent, deleteEvent, listEvents } from '../api/calendarEvents';

const queryKey = ['calendarEvents'];

export function useCalendarEvents() {
  return useQuery({ queryKey, queryFn: listEvents });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; start_at: string; all_day: boolean }) => createEvent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}
