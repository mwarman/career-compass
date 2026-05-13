import { cva } from 'class-variance-authority';
import { JSX } from 'react';

import { Item } from '@/components/shadcn/item';

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
 * Class variance for the message bubble wrapper, controlling alignment based on message role.
 */
const wrapperVariants = cva('flex mb-4', {
  variants: {
    role: {
      user: 'justify-end',
      assistant: 'justify-start',
    },
  },
  defaultVariants: {
    role: 'assistant',
  },
});

const itemVariants = cva('max-w-4/5 rounded-lg p-4', {
  variants: {
    role: {
      user: 'border-primary bg-primary text-primary-foreground',
      assistant: '',
    },
  },
  defaultVariants: {
    role: 'assistant',
  },
});

/**
 * MessageBubble component renders a single message in the chat interface.
 * User messages are right-aligned with a blue background.
 * Assistant messages are left-aligned with a neutral background.
 *
 * @param props - Component props
 * @param props.role - Message role ('user' or 'assistant')
 * @param props.content - Message text content
 */
export const MessageBubble = ({ role, content }: MessageBubbleProps): JSX.Element => {
  const isUser = role === 'user';

  return (
    <div className={wrapperVariants({ role })}>
      <Item variant={isUser ? 'outline' : 'muted'} className={itemVariants({ role })}>
        <p className="text-sm leading-relaxed">{content}</p>
      </Item>
    </div>
  );
};
