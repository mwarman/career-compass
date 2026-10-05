import { JSX } from 'react';

import { Markdown } from '@/components/common/Markdown';
import { Bubble, BubbleContent } from '@/components/shadcn/bubble';
import { Message, MessageContent } from '@/components/shadcn/message';

/**
 * Props for the MessageBubble component.
 */
export interface MessageBubbleProps {
  /** The role of the message sender: 'user' or 'assistant' */
  role: 'user' | 'assistant';
  /** The text content of the message */
  content: string;
}

/**
 * MessageBubble component renders a single message in the chat interface.
 * Uses shadcn Message and Bubble components for proper alignment and styling.
 * User messages are right-aligned with a primary color bubble.
 * Assistant messages are left-aligned with a ghost (unframed) bubble.
 *
 * @param props - Component props
 * @param props.role - Message role ('user' or 'assistant')
 * @param props.content - Message text content
 */
export const MessageBubble = ({ role, content }: MessageBubbleProps): JSX.Element => {
  const isUser = role === 'user';
  const align = isUser ? 'end' : 'start';
  const variant = isUser ? 'default' : 'ghost';

  return (
    <Message align={align}>
      <MessageContent>
        <Bubble variant={variant} align={align}>
          <BubbleContent>
            <Markdown className="text-sm leading-relaxed">{content}</Markdown>
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
};
