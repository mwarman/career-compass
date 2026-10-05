import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReasoningIndicator } from './ReasoningIndicator';

describe('ReasoningIndicator', () => {
  it('should render with status role for accessibility', () => {
    const { container } = render(<ReasoningIndicator />);
    const marker = container.querySelector('[role="status"]');
    expect(marker).toBeTruthy();
  });

  it('should display thinking status text', () => {
    render(<ReasoningIndicator />);
    expect(screen.getByText('Thinking...')).toBeTruthy();
  });

  it('should render spinner icon', () => {
    const { container } = render(<ReasoningIndicator />);
    // The Spinner component renders an SVG with role="status"
    const spinner = container.querySelector('svg[role="status"]');
    expect(spinner).toBeTruthy();
  });
});
