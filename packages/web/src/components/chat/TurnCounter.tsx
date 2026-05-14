import { JSX } from 'react';

import { MAX_CONVERSATION_TURNS } from '@/utils/constants';

export interface TurnCounterProps {
  /**
   * Current turn number in the conversation.
   */
  turnCount: number;
}

/**
 * TurnCounter component - displays the current turn number and maximum turns.
 * Provides users with clear visibility into conversation boundaries and progress.
 *
 * Displays "Turn N of 10" format. Only rendered when a session is active (turnCount > 0).
 *
 * @param props - Component props
 * @returns Rendered turn counter element
 */
export const TurnCounter = ({ turnCount }: TurnCounterProps): JSX.Element => {
  return (
    <div className="text-muted-foreground text-sm font-medium">
      Turn {turnCount} of {MAX_CONVERSATION_TURNS}
    </div>
  );
};
