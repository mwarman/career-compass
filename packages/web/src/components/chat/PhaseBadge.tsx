import { ConversationPhase } from '@career-compass/shared';
import { cva } from 'class-variance-authority';
import { JSX } from 'react';

import { Badge } from '@/components/shadcn/badge';

/**
 * PhaseBadge component renders the conversation phase indicator as a shadcn Badge.
 * Uses badge variants to visually distinguish different phases.
 */
const phaseBadgeVariants = cva('mx-2', {
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
  <Badge className={phaseBadgeVariants({ phase })}>{getPhaseLabel(phase)}</Badge>
);
