import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyGoals, upsertMyGoals, type UserGoals } from '../api/userGoals';

export function useUserGoals() {
  return useQuery({ queryKey: ['userGoals'], queryFn: getMyGoals });
}

export function useUpsertUserGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<UserGoals, 'user_id'>>) => upsertMyGoals(patch),
    onSuccess: (data) => queryClient.setQueryData(['userGoals'], data),
  });
}
