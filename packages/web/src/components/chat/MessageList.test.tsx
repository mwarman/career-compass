import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MessageList } from './MessageList';

describe('MessageList', () => {
  it('should render messages with log role for accessibility', () => {
    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
    ];

    render(<MessageList messages={messages} />);

    // Check for log role
    const messageList = screen.getByRole('log');
    expect(messageList).toBeTruthy();
    expect(messageList.getAttribute('aria-label')).toBe('Conversation messages');
  });

  it('should display all messages', () => {
    const messages = [
      { role: 'user' as const, content: 'What should I learn?' },
      { role: 'assistant' as const, content: 'Based on your goals...' },
      { role: 'user' as const, content: 'How long will it take?' },
      { role: 'assistant' as const, content: 'Approximately 3 months...' },
    ];

    render(<MessageList messages={messages} />);

    // Verify all messages are rendered
    expect(screen.getByText('What should I learn?')).toBeTruthy();
    expect(screen.getByText('Based on your goals...')).toBeTruthy();
    expect(screen.getByText('How long will it take?')).toBeTruthy();
    expect(screen.getByText('Approximately 3 months...')).toBeTruthy();
  });

  it('should render empty list when no messages provided', () => {
    render(<MessageList messages={[]} />);

    const messageList = screen.getByRole('log');
    expect(messageList).toBeTruthy();
    // Empty list should have no children (messages)
    expect(messageList.children.length).toBe(0);
  });

  it('should auto-scroll to bottom on message changes', async () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const messages = [
      { role: 'user' as const, content: 'Question 1' },
      { role: 'assistant' as const, content: 'Answer 1' },
    ];

    render(<MessageList messages={messages} />);

    // Wait for scroll to be called
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });
});
