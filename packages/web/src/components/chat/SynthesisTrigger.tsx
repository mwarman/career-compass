import { JSX } from 'react';

import { Button } from '@/components/shadcn/button';
import { MIN_TURNS_FOR_SYNTHESIS } from '@/utils/constants';

export interface SynthesisTriggerProps {
  /**
   * Current turn count in the conversation.
   */
  turnCount: number;
  /**
   * Current conversation phase.
   */
  phase: string;
  /**
   * Whether recommendations are ready (API signaled synthesisReady: true).
   * When true, the button pulses to draw user attention.
   */
  synthesisReady: boolean;
  /**
   * Whether a recommendation has been generated (non-null).
   */
  hasRecommendation: boolean;
  /**
   * Callback when the trigger button is clicked.
   * Should submit the SYNTHESIS_TRIGGER_PHRASE as the user message.
   */
  onTrigger: () => void;
  /**
   * Whether the submission is pending.
   */
  isSubmitting: boolean;
}

/**
 * SynthesisTrigger component - button to explicitly trigger synthesis recommendations.
 *
 * Display conditions:
 * - Visible when turnCount >= MIN_TURNS_FOR_SYNTHESIS
 * - Hidden when phase === 'synthesis' or hasRecommendation === true
 * - Pulses when synthesisReady === true to prompt user action
 *
 * Clicking the button calls onTrigger, which submits SYNTHESIS_TRIGGER_PHRASE
 * via useSubmitTurn, same path as manual message submission.
 *
 * @param props - Component props
 * @returns Rendered trigger button or null if conditions not met
 */
export const SynthesisTrigger = ({
  turnCount,
  phase,
  synthesisReady,
  hasRecommendation,
  onTrigger,
  isSubmitting,
}: SynthesisTriggerProps): JSX.Element | null => {
  // Hide if synthesis is complete or in progress
  if (phase === 'synthesis' || hasRecommendation) {
    return null;
  }

  // Only show if minimum turns have passed
  if (turnCount < MIN_TURNS_FOR_SYNTHESIS) {
    return null;
  }

  return (
    <Button
      onClick={onTrigger}
      disabled={isSubmitting}
      className={`w-full transition-all ${synthesisReady ? 'ring-primary animate-pulse ring-2 ring-offset-2' : ''}`}
      aria-label="Submit synthesis trigger to get recommendations"
      title="Click to receive personalized career recommendations"
    >
      {isSubmitting ? 'Generating...' : "I'm ready for recommendations"}
    </Button>
  );
};
