import { JSX, useState } from 'react';

import { MessageList } from '@/components/chat/MessageList';
import { PhaseBadge } from '@/components/chat/PhaseBadge';
import { RecommendationPanel } from '@/components/chat/RecommendationPanel';
import { SeedMessage } from '@/components/chat/SeedMessage';
import { SynthesisTrigger } from '@/components/chat/SynthesisTrigger';
import { TurnCounter } from '@/components/chat/TurnCounter';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { Textarea } from '@/components/shadcn/textarea';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useSession } from '@/context/SessionContext';
import { useSubmitTurn } from '@/hooks/use-submit-turn';
import { SYNTHESIS_TRIGGER_PHRASE } from '@/utils/constants';

/**
 * ChatPage component - main conversational UI for Career Compass.
 * Displays:
 * - Phase indicator badge, turn counter, and "Start Over" button in header
 * - Seed input view when sessionId is null
 * - Scrollable message history with auto-scroll to bottom when sessionId is populated
 * - RecommendationPanel when recommendation object is available
 * - Textarea for message submission with Enter to submit, Shift+Enter for newlines
 * - Synthesis trigger button to explicitly request recommendations
 * - Submit button with loading state
 */
export const ChatPage = (): JSX.Element => {
  const { messages, phase, sessionId, recommendation, turnCount, synthesisReady, resetSession } = useSession();
  const { mutate: submitTurn, isPending, error } = useSubmitTurn();
  const [inputValue, setInputValue] = useState('');

  /**
   * Handle form submission.
   */
  const handleSubmit = (): void => {
    if (inputValue.trim() === '' || isPending) {
      return;
    }

    submitTurn(
      { userMessage: inputValue.trim() },
      {
        onSuccess: () => {
          setInputValue('');
        },
      },
    );
  };

  /**
   * Handle synthesis trigger button click.
   * Submits the SYNTHESIS_TRIGGER_PHRASE as the user message, same as manual typing.
   */
  const handleTriggerSynthesis = (): void => {
    if (isPending) {
      return;
    }

    submitTurn(
      { userMessage: SYNTHESIS_TRIGGER_PHRASE },
      {
        onSuccess: () => {
          // No need to clear inputValue; user may continue typing after trigger
        },
      },
    );
  };

  /**
   * Handle Enter key press in textarea field.
   * - Enter alone: submit message
   * - Shift+Enter: insert newline
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header with phase indicator, turn counter, and start over button */}
      <div className="border-border flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-foreground text-2xl font-semibold">Career Compass</h1>
        <div className="flex items-center gap-4">
          <PhaseBadge phase={phase} />
          {sessionId && <TurnCounter turnCount={turnCount} />}
          {sessionId && (
            <Button variant="outline" size="sm" onClick={resetSession} aria-label="Start a new conversation">
              Start Over
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Scrollable message history, seed prompt, and recommendation panel */}
      <ScrollArea className="min-h-0 flex-1 px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {sessionId === null ? (
            <SeedMessage />
          ) : messages.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <p>Start a conversation to receive career guidance.</p>
            </div>
          ) : (
            <>
              <MessageList messages={messages} />
              {recommendation && <RecommendationPanel recommendation={recommendation} />}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Fixed input area at bottom */}
      <div className="border-border bg-background border-t px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            autoComplete="off"
          >
            <fieldset disabled={!!recommendation} className="flex gap-3">
              <div className="flex flex-1 flex-col">
                {/* Accessible label for textarea field */}
                <Label htmlFor="message-input" className="sr-only">
                  Message input
                </Label>
                <Textarea
                  id="message-input"
                  placeholder={
                    sessionId === null
                      ? 'Describe your current role, experience, skills, and career goals...'
                      : 'Type your message...'
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isPending}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'error-message' : undefined}
                />
                {/* Error message display */}
                {error && (
                  <p id="error-message" className="text-destructive mt-2 text-sm">
                    {error.message || 'An error occurred. Please try again.'}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isPending || inputValue.trim() === ''}
                aria-label={isPending ? 'Sending message...' : 'Send message'}
                className="mb-3 self-end px-4"
              >
                {isPending ? 'Sending...' : 'Send'}
              </Button>
            </fieldset>
          </form>

          {/* Conditionally display Synthesis Trigger button */}
          {sessionId && (
            <SynthesisTrigger
              turnCount={turnCount}
              phase={phase}
              synthesisReady={synthesisReady}
              hasRecommendation={recommendation !== null}
              onTrigger={handleTriggerSynthesis}
              isSubmitting={isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
};
