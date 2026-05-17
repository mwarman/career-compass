import { QueryClientProvider } from '@tanstack/react-query';
import { JSX } from 'react';

import { SessionProvider } from '@/context/session-context';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ChatPage } from '@/pages/ChatPage';
import { queryClient } from '@/utils/query-client';

/**
 * App component - root of the Career Compass application.
 * Sets up theme provider, TanStack Query, and Session providers and renders the main interface.
 * Theme defaults to dark mode with system preference detection.
 */
export const App = (): JSX.Element => {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ChatPage />
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
