import { QueryClient } from '@tanstack/react-query';

// A shared singleton so code outside the component tree — like the offline
// sync queue draining in the background — can invalidate queries too,
// instead of only ever refreshing when a component happens to be mounted.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});
