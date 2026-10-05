import { ArrowLeftFromLine, ArrowUp } from 'lucide-react';
import { JSX, useRef, useState } from 'react';

import { About } from '@/components/about/About';
import { MessageList } from '@/components/chat/MessageList';
import { PhaseBadge } from '@/components/chat/PhaseBadge';
import { ReasoningIndicator } from '@/components/chat/ReasoningIndicator';
import { RecommendationPanel } from '@/components/chat/RecommendationPanel';
import { SeedMessage } from '@/components/chat/SeedMessage';
import { SynthesisTrigger } from '@/components/chat/SynthesisTrigger';
import { TurnCounter } from '@/components/chat/TurnCounter';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/shadcn/message-scroller';
import { Textarea } from '@/components/shadcn/textarea';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useSession } from '@/context/SessionContext';
import { useSubmitTurn } from '@/hooks/useSubmitTurn';
import { SYNTHESIS_TRIGGER_PHRASE } from '@/utils/constants';

/**
 * ChatPage component - main conversational UI for Career Compass.
 * Displays:
 * - Phase indicator badge, turn counter, and "Start Over" button in header
 * - Seed input view when sessionId is null
 * - Scrollable message history with smart anchoring when sessionId is populated
 * - Reasoning indicator ("Thinking...") while a turn is in flight
 * - RecommendationPanel when recommendation object is available
 * - Textarea for message submission with Enter to submit, Shift+Enter for newlines
 * - Synthesis trigger button to explicitly request recommendations
 * - Submit button with loading state
 *
 * Uses MessageScroller for advanced scroll behavior:
 * - Auto-scrolls to latest message while user is reading
 * - Anchors new user turns near the top of the viewport
 * - Preserves scroll position while assistant reply streams in
 */
export const ChatPage = (): JSX.Element => {
  const { messages, phase, sessionId, recommendation, turnCount, synthesisReady, resetSession } = useSession();
  const { mutate: submitTurn, isPending, error } = useSubmitTurn();
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle form submission.
   * Clears textarea immediately, then submits. On success, focuses textarea.
   * On error, repopulates textarea with the message and focuses it.
   */
  const handleSubmit = (): void => {
    if (inputValue.trim() === '' || isPending) {
      return;
    }

    const messageToSubmit = inputValue.trim();
    setInputValue(''); // Clear immediately

    submitTurn(
      { userMessage: messageToSubmit },
      {
        onSuccess: () => {
          // Focus textarea after response is received
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 0);
        },
        onError: () => {
          // Repopulate textarea and focus on error
          setInputValue(messageToSubmit);
          textareaRef.current?.focus();
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
      <div className="border-border bg-background sticky top-0 z-40 flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-bold">Career Compass</h1>
        <div className="flex items-center gap-2">
          <PhaseBadge phase={phase} />
          {sessionId && <TurnCounter turnCount={turnCount} />}
          {sessionId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSession}
              aria-label="Start a new conversation"
              title="Start a new conversation"
            >
              <ArrowLeftFromLine className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Start Over</span>
            </Button>
          )}
          <About />
          <ThemeToggle />
        </div>
      </div>

      {/* Message scroll area with smart anchoring and auto-scroll */}
      <MessageScrollerProvider defaultScrollPosition="end" autoScroll scrollPreviousItemPeek={64}>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent aria-busy={isPending} className="mx-auto max-w-2xl space-y-6 px-6 py-4">
              {sessionId === null ? (
                <MessageScrollerItem messageId="seed" scrollAnchor={false}>
                  <SeedMessage />
                </MessageScrollerItem>
              ) : messages.length === 0 && !isPending ? (
                <MessageScrollerItem messageId="empty" scrollAnchor={false}>
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <p>Start a conversation to receive career guidance.</p>
                  </div>
                </MessageScrollerItem>
              ) : (
                <>
                  <MessageList messages={messages} />
                  {isPending && (
                    <MessageScrollerItem messageId="reasoning" scrollAnchor={false}>
                      <ReasoningIndicator />
                    </MessageScrollerItem>
                  )}
                  {recommendation && (
                    <MessageScrollerItem messageId="recommendation" scrollAnchor={false}>
                      <RecommendationPanel recommendation={recommendation} />
                    </MessageScrollerItem>
                  )}
                </>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      {/* Fixed input area at bottom */}
      <div className="border-border bg-background sticky bottom-0 z-40 border-t px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            autoComplete="off"
          >
            <fieldset disabled={!!recommendation}>
              <div className="flex flex-1 flex-col">
                <div className="relative">
                  {/* Accessible label for textarea field */}
                  <Label htmlFor="message-input" className="sr-only">
                    Message input
                  </Label>
                  <Textarea
                    ref={textareaRef}
                    id="message-input"
                    className="max-h-48 min-h-20 resize-none border pr-14"
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
                  {/* Submit button positioned inside textarea lower right corner */}
                  <Button
                    type="submit"
                    size="icon"
                    variant="default"
                    disabled={isPending || inputValue.trim() === ''}
                    aria-label={isPending ? 'Sending message...' : 'Send message'}
                    className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
                {/* Error message display */}
                {error && (
                  <p id="error-message" className="text-destructive mt-2 text-sm">
                    {error.message || 'An error occurred. Please try again.'}
                  </p>
                )}
              </div>
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
