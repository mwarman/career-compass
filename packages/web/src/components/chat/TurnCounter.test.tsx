import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TurnCounter } from './TurnCounter';

describe('TurnCounter', () => {
  it('should display turn count and maximum turns', () => {
    render(<TurnCounter turnCount={3} />);

    const element = screen.getByText('Turn 3 of 10');
    expect(element).toBeTruthy();
  });

  it('should display turn 1 when at first turn', () => {
    render(<TurnCounter turnCount={1} />);

    const element = screen.getByText('Turn 1 of 10');
    expect(element).toBeTruthy();
  });

  it('should display turn 10 when at maximum turns', () => {
    render(<TurnCounter turnCount={10} />);

    const element = screen.getByText('Turn 10 of 10');
    expect(element).toBeTruthy();
  });

  it('should have appropriate CSS classes for styling', () => {
    const { container } = render(<TurnCounter turnCount={5} />);

    const turnCountDiv = container.querySelector('div');
    expect(turnCountDiv?.className).toContain('text-sm');
    expect(turnCountDiv?.className).toContain('font-medium');
    expect(turnCountDiv?.className).toContain('text-muted-foreground');
  });
});
