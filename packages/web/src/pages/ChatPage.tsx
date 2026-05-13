import { JSX, useEffect, useRef, useState } from 'react';

import { MessageBubble } from '@/components/chat/MessageBubble';
import { PhaseLabel } from '@/components/chat/PhaseLabel';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { useSession } from '@/context/session-context';
import { useSubmitTurn } from '@/hooks/use-submit-turn';

/**
 * ChatPage component - main conversational UI for Career Compass.
 * Displays:
 * - Phase indicator badge in header
 * - Scrollable message history with auto-scroll to bottom
 * - Input field with accessible label
 * - Submit button with loading state
 */
export const ChatPage = (): JSX.Element => {
  const { messages, phase } = useSession();
  const { mutate: submitTurn, isPending, error } = useSubmitTurn();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when messages change.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
   * Handle Enter key press in input field.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header with phase indicator */}
      <div className="border-border flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-foreground text-2xl font-semibold">Career Compass</h1>
        <PhaseLabel phase={phase} />
      </div>

      {/* Scrollable message history */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="mx-auto max-w-2xl">
          {messages.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <p>Start a conversation to receive career guidance.</p>
            </div>
          ) : (
            <>
              {/* Message list with ARIA role for accessibility */}
              <div role="log" aria-label="Conversation messages" className="space-y-2">
                {messages.map((message, index) => (
                  <MessageBubble key={index} role={message.role} content={message.content} />
                ))}
              </div>
              {/* Anchor for auto-scroll to bottom */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Fixed input area at bottom */}
      <div className="border-border bg-background border-t px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex gap-3"
            autoComplete="off"
          >
            <div className="flex flex-1 flex-col">
              {/* Accessible label for input field */}
              <Label htmlFor="message-input" className="sr-only">
                Message input
              </Label>
              <Input
                id="message-input"
                type="text"
                placeholder="Type your message..."
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
              className="px-4"
            >
              {isPending ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
