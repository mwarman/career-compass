import { JSX } from 'react';

import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/shadcn/empty';
import { Separator } from '@/components/shadcn/separator';

/**
 * SeedMessage component displays the initial prompt when starting a new session.
 * Rendered in the message history area when sessionId is null.
 * The user enters their seed input (current role, tech stack, goals) in the textarea below.
 *
 * This is a static, informational component that guides the user on what to share.
 */
export const SeedMessage = (): JSX.Element => {
  return (
    <Empty>
      <EmptyHeader className="gap-4">
        <EmptyTitle className="text-lg font-semibold">Welcome to Career Compass</EmptyTitle>
        <EmptyDescription>
          Share your current professional context to get personalized upskilling recommendations.
        </EmptyDescription>
        <EmptyContent>
          <div className="bg-muted text-foreground/80 rounded-lg px-4 py-3 text-sm">
            <p className="mb-2 font-medium">In the message box below, tell us:</p>
            <ul className="list-disc space-y-1 pl-12 text-left">
              <li>Your current role and experience level</li>
              <li>Technologies or skills you currently use</li>
              <li>Your career goals and aspirations</li>
            </ul>
            <Separator className="my-4" />
            <p>I am a [your current role] with [X] years of experience. I am looking to [your career goal].</p>
          </div>
          <p className="text-muted-foreground text-xs">Press Enter to submit your message</p>
        </EmptyContent>
      </EmptyHeader>
    </Empty>
  );
};
