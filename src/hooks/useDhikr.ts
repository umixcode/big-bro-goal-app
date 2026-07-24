import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTodayDhikr, incrementDhikr, type DhikrLog } from '../api/dhikr';

const queryKey = ['dhikr', 'today'] as const;

export function useDhikrToday() {
  return useQuery({ queryKey, queryFn: () => getTodayDhikr() });
}

export function useIncrementDhikr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (delta: number) => incrementDhikr(delta),
    onMutate: async (delta: number) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DhikrLog | null>(queryKey);
      queryClient.setQueryData<DhikrLog | null>(queryKey, (old) =>
        old
          ? { ...old, count: old.count + delta }
          : {
              id: 'optimistic',
              user_id: '',
              date: '',
              dhikr_type: 'General',
              count: Math.max(delta, 0),
              target_count: null,
            }
      );
      return { previous };
    },
    onError: (_err, _delta, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
