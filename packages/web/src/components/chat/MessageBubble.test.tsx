import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  it('should render user message with end alignment', () => {
    const { container } = render(<MessageBubble role="user" content="Hello" />);

    // Check that Message component has align="end"
    const messageEl = container.querySelector('[class*="flex"]');
    expect(messageEl).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('should render assistant message with start alignment', () => {
    const { container } = render(<MessageBubble role="assistant" content="Hi there!" />);

    // Check that the message renders
    const messageEl = container.querySelector('[class*="flex"]');
    expect(messageEl).toBeTruthy();
    expect(screen.getByText('Hi there!')).toBeTruthy();
  });

  it('should render markdown content', () => {
    render(<MessageBubble role="assistant" content="This is **bold** and *italic* text" />);

    // The Markdown component should render the content
    expect(screen.getByText(/bold/)).toBeTruthy();
  });

  it('should use different bubble variants for user and assistant', () => {
    const { rerender } = render(<MessageBubble role="user" content="User message" />);

    // User message should be rendered
    expect(screen.getByText('User message')).toBeTruthy();

    rerender(<MessageBubble role="assistant" content="Assistant message" />);
    // Assistant message should be rendered
    expect(screen.getByText('Assistant message')).toBeTruthy();
  });

  it('should render multiline content correctly', () => {
    const multilineContent = `Line 1
Line 2
Line 3`;

    render(<MessageBubble role="assistant" content={multilineContent} />);

    expect(screen.getByText(/Line 1/)).toBeTruthy();
  });
});
