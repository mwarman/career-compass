import { ConversationPhase } from '@career-compass/shared';
import { cva } from 'class-variance-authority';
import { ArrowDown } from 'lucide-react';
import { JSX } from 'react';

import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/shadcn/sheet';

/**
 * PhaseBadge component renders the conversation phase indicator as a shadcn Badge.
 * Uses badge variants to visually distinguish different phases.
 */
const phaseBadgeVariants = cva('', {
  variants: {
    phase: {
      discovery:
        'border-neutral-500/30 bg-neutral-500/10 text-neutral-700 hover:bg-neutral-500/20 dark:border-neutral-700/30 dark:bg-neutral-700/10 dark:text-neutral-300 dark:hover:bg-neutral-700/20',
      goalElicitation: 'border-blue-500/30 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400',
      synthesis: 'border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400',
    },
  },
  defaultVariants: {
    phase: 'discovery',
  },
});

/**
 * Props for the PhaseBadge component.
 */
export interface PhaseBadgeProps {
  /** The current conversation phase */
  phase: ConversationPhase;
}

const getPhaseLabel = (phase: ConversationPhase): string => {
  switch (phase) {
    case 'discovery':
      return 'Discovery';
    case 'goalElicitation':
      return 'Goal Elicitation';
    case 'synthesis':
      return 'Synthesis';
    default:
      return 'Unknown';
  }
};

/**
 * PhaseBadge component renders the conversation phase indicator as a shadcn Badge.
 * Uses badge variants to visually distinguish different phases.
 *
 * Variants by phase:
 * - discovery: secondary (neutral background)
 * - goalElicitation: default (primary background)
 * - synthesis: outline (bordered style)
 */
export const PhaseBadge = ({ phase }: PhaseBadgeProps): JSX.Element => (
  <Sheet>
    <SheetTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Current phase: ${getPhaseLabel(phase)}`}
        title={`Current phase: ${getPhaseLabel(phase)}`}
      >
        <Badge className={phaseBadgeVariants({ phase })}>{getPhaseLabel(phase)}</Badge>
      </Button>
    </SheetTrigger>
    <SheetContent showCloseButton={false}>
      <SheetHeader>
        <SheetTitle>Phase Badge</SheetTitle>
        <SheetDescription>A visual indicator of the current conversational phase.</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-4 px-8">
        <div>
          The Phase Badge serves as a visual indicator of the current conversational phase in the Career Compass
          application. It uses different styles to represent each phase, providing users with immediate context about
          where they are in the conversation flow.
        </div>
        <h4 className="mt-8 text-base font-semibold uppercase">Phase Progression</h4>
        <div>
          <span className="font-semibold uppercase">Discovery:</span> The initial phase where the AI assistant gathers
          information about the user's background, skills, and preferences.
        </div>
        <ArrowDown className="mx-auto" />
        <div>
          <span className="font-semibold uppercase">Goal Elicitation:</span> The phase where the AI assistant helps the
          user articulate their career goals and aspirations based on the information gathered.
        </div>
        <ArrowDown className="mx-auto" />
        <div>
          <span className="font-semibold uppercase">Synthesis:</span> The final phase where the AI assistant synthesizes
          the information and goals to generate personalized career recommendations.
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);
