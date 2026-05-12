import { QueryClientProvider } from '@tanstack/react-query';
import { JSX } from 'react';

import { Button } from '@/components/shadcn/button';
import { SessionProvider } from '@/context/session-context';
import { queryClient } from '@/utils/query-client';

/**
 * App component - root of the Career Compass application.
 * Sets up TanStack Query and Session providers and renders the main interface.
 */
export const App = (): JSX.Element => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <div className="bg-background min-h-screen p-8">
          <h1 className="mb-8 text-4xl font-bold">Career Compass</h1>

          {/* Test Tailwind utility classes */}
          <div className="mb-6 rounded bg-blue-500 p-4 text-white">
            <p>Tailwind styling test</p>
          </div>

          {/* Test shadcn/ui Button component */}
          <Button variant="default" size="default">
            Get Started
          </Button>
        </div>
      </SessionProvider>
    </QueryClientProvider>
  );
};
