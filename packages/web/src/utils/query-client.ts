import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient instance for managing server state.
 * Shared across the entire application via QueryClientProvider.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
    },
  },
});
