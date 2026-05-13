import { JSX, useEffect, useRef } from 'react';

import { MessageBubble } from '@/components/chat/MessageBubble';
import { Message } from '@/context/session-context';

/**
 * Props for the MessageList component.
 */
export interface MessageListProps {
  /** Array of messages to display */
  messages: Message[];
}

/**
 * MessageList component renders the conversation message history.
 * Handles auto-scroll to bottom when new messages arrive.
 *
 * @param props - Component props
 * @param props.messages - Array of messages to display
 */
export const MessageList = ({ messages }: MessageListProps): JSX.Element => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when messages change.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
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
  );
};
