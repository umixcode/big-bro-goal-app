import { useQuery } from '@tanstack/react-query';
import { ensureActiveEnrollment } from '../api/workoutEnrollment';

// Fetch-or-create, enabled only once phaseId is known. staleTime: Infinity
// because one enrollment persists for the life of the phase — this only ever
// does real (write) work once per phase per user.
export function useEnsureEnrollment(phaseId: string | undefined) {
  return useQuery({
    queryKey: ['workoutEnrollment', phaseId],
    queryFn: () => ensureActiveEnrollment(phaseId as string),
    enabled: !!phaseId,
    staleTime: Infinity,
  });
}
