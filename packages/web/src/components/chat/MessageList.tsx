import { JSX } from 'react';

import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageScrollerItem } from '@/components/shadcn/message-scroller';
import { Message } from '@/context/SessionContext';

/**
 * Props for the MessageList component.
 */
export interface MessageListProps {
  /** Array of messages to display */
  messages: Message[];
}

/**
 * MessageList component renders the conversation message history.
 * Each message is wrapped in a MessageScrollerItem for proper scroll handling.
 * User messages are marked as scroll anchors to position new turns near the top of the viewport.
 *
 * @param props - Component props
 * @param props.messages - Array of messages to display
 */
export const MessageList = ({ messages }: MessageListProps): JSX.Element => (
  <>
    {messages.map((message, index) => (
      <MessageScrollerItem key={index} messageId={String(index)} scrollAnchor={message.role === 'user'}>
        <MessageBubble role={message.role} content={message.content} />
      </MessageScrollerItem>
    ))}
  </>
);
