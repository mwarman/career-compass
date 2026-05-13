import { ConversationPhase } from '@career-compass/shared';
import { cva } from 'class-variance-authority';
import { JSX } from 'react';

import { Label } from '@/components/shadcn/label';

/**
 * Props for the PhaseLabel component.
 */
export interface PhaseLabelProps {
  /** The current conversation phase */
  phase: ConversationPhase;
}

/**
 * Class variance for the phase label, controlling styling based on conversation phase.
 */
const labelVariants = cva('cursor-default rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase', {
  variants: {
    phase: {
      discovery: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100',
      goalElicitation: 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
      synthesis: 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100',
    },
  },
  defaultVariants: {
    phase: 'discovery',
  },
});

/**
 * PhaseLabel component renders the conversation phase indicator badge.
 * Encapsulates all phase-specific styling and label logic.
 *
 * Styling by phase:
 * - discovery: neutral gray background
 * - goalElicitation: blue background
 * - synthesis: green background
 *
 * @param props - Component props
 * @param props.phase - The current conversation phase
 */
export const PhaseLabel = ({ phase }: PhaseLabelProps): JSX.Element => {
  const getLabel = (ph: ConversationPhase): string => {
    switch (ph) {
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

  return <Label className={labelVariants({ phase })}>{getLabel(phase)}</Label>;
};
