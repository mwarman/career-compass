import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TurnCounter } from './TurnCounter';

describe('TurnCounter', () => {
  describe('rendering', () => {
    it('should display turn count and maximum turns', () => {
      render(<TurnCounter turnCount={3} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Turn 3 of 10');
    });

    it('should display turn 1 when at first turn', () => {
      render(<TurnCounter turnCount={1} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Turn 1 of 10');
    });

    it('should display turn 10 when at maximum turns', () => {
      render(<TurnCounter turnCount={10} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Turn 10 of 10');
    });

    it('should have correct aria-label with current turn and maximum', () => {
      render(<TurnCounter turnCount={5} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Turn 5 of 10');
    });

    it('should have correct title attribute', () => {
      render(<TurnCounter turnCount={5} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('title')).toBe('Turn 5 of 10');
    });
  });

  describe('sheet interaction', () => {
    it('should open sheet when turn counter button is clicked', async () => {
      const user = userEvent.setup();
      render(<TurnCounter turnCount={3} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Conversation Turn Counter')).toBeTruthy();
    });

    it('should display sheet title and description', async () => {
      const user = userEvent.setup();
      render(<TurnCounter turnCount={3} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Conversation Turn Counter')).toBeTruthy();
      expect(screen.getByText('Displays the current turn number and maximum turns in the conversation.')).toBeTruthy();
    });

    it('should display information about turn counter purpose', async () => {
      const user = userEvent.setup();
      render(<TurnCounter turnCount={3} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(
        screen.getByText(
          /The Turn Counter provides users with clear visibility into the current turn number and the maximum number of turns allowed in the conversation/,
        ),
      ).toBeTruthy();
    });

    it('should display information about turn format', async () => {
      const user = userEvent.setup();
      render(<TurnCounter turnCount={3} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText(/The counter is displayed in a "Turn N \/ MAX" format/)).toBeTruthy();
    });

    it('should display close button', async () => {
      const user = userEvent.setup();
      render(<TurnCounter turnCount={3} />);

      const button = screen.getByRole('button');
      await user.click(button);

      const closeButton = screen.getByRole('button', { name: /Close/ });
      expect(closeButton).toBeTruthy();
    });

    it('should close sheet when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<TurnCounter turnCount={3} />);

      const button = screen.getByRole('button', { name: /Turn 3 of 10/ });
      await user.click(button);

      expect(screen.getByText('Conversation Turn Counter')).toBeTruthy();

      const closeButton = screen.getByRole('button', { name: /Close/ });
      await user.click(closeButton);

      // After closing, the sheet content should be removed from the document
      const sheetTitle = screen.queryByText('Conversation Turn Counter');
      expect(sheetTitle).toBeNull();
    });
  });

  describe('different turn counts', () => {
    it('should display mid-range turn counts correctly', () => {
      render(<TurnCounter turnCount={5} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Turn 5 of 10');
    });

    it('should display high turn counts correctly', () => {
      render(<TurnCounter turnCount={9} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Turn 9 of 10');
    });

    it('should handle turn count 0', () => {
      render(<TurnCounter turnCount={0} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Turn 0 of 10');
    });
  });
});
