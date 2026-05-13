import { QueryClientProvider } from '@tanstack/react-query';
import { JSX } from 'react';

import { SessionProvider } from '@/context/session-context';
import { ChatPage } from '@/pages/ChatPage';
import { queryClient } from '@/utils/query-client';

/**
 * App component - root of the Career Compass application.
 * Sets up TanStack Query and Session providers and renders the main interface.
 */
export const App = (): JSX.Element => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ChatPage />
      </SessionProvider>
    </QueryClientProvider>
  );
};
