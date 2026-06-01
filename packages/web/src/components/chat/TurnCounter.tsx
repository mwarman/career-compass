import { JSX } from 'react';

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
 * When clicked, opens a sheet with more information about the turn counter and its
 * purpose in the conversation flow.
 *
 * @param props - Component props
 * @param props.turnCount - Current turn number to display
 * @returns Rendered turn counter element
 */
export const TurnCounter = ({ turnCount }: TurnCounterProps): JSX.Element => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Turn ${turnCount} of ${MAX_CONVERSATION_TURNS}`}
          title={`Turn ${turnCount} of ${MAX_CONVERSATION_TURNS}`}
        >
          Turn {turnCount}/{MAX_CONVERSATION_TURNS}
        </Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>Conversation Turn Counter</SheetTitle>
          <SheetDescription>Displays the current turn number and maximum turns in the conversation.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div>
            The Turn Counter provides users with clear visibility into the current turn number and the maximum number of
            turns allowed in the conversation. It is designed to help users understand how many interactions they have
            had with the AI assistant and how many they have left before reaching the conversation limit.
          </div>
          <div>
            The counter is displayed in a "Turn N / MAX" format, where N is the current turn number. This component is
            only rendered when a session is active (i.e., when number is greater than 0) to avoid confusion when no
            conversation has started.
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
};
