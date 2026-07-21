import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyProfile, upsertMyProfile, type Profile } from '../api/profiles';

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: getMyProfile });
}

export function useUpsertProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<Profile, 'id'>>) => upsertMyProfile(patch),
    onSuccess: (data) => queryClient.setQueryData(['profile'], data),
  });
}
