import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PhaseBadge } from './PhaseBadge';

describe('PhaseBadge', () => {
  describe('rendering', () => {
    it('should display discovery phase badge', () => {
      render(<PhaseBadge phase="discovery" />);

      const badge = screen.getByText('Discovery');
      expect(badge).toBeTruthy();
      expect(badge.className).toContain('bg-neutral-500/10');
    });

    it('should display goalElicitation phase badge', () => {
      render(<PhaseBadge phase="goalElicitation" />);

      const badge = screen.getByText('Goal Elicitation');
      expect(badge).toBeTruthy();
      expect(badge.className).toContain('bg-blue-500/10');
    });

    it('should display synthesis phase badge', () => {
      render(<PhaseBadge phase="synthesis" />);

      const badge = screen.getByText('Synthesis');
      expect(badge).toBeTruthy();
      expect(badge.className).toContain('bg-green-500/10');
    });

    it('should have correct aria-label for accessibility', () => {
      render(<PhaseBadge phase="discovery" />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Current phase: Discovery');
    });

    it('should have correct title attribute', () => {
      render(<PhaseBadge phase="goalElicitation" />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('title')).toBe('Current phase: Goal Elicitation');
    });
  });

  describe('sheet interaction', () => {
    it('should open sheet when badge button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhaseBadge phase="discovery" />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Phase Badge')).toBeTruthy();
    });

    it('should display sheet title and description', async () => {
      const user = userEvent.setup();
      render(<PhaseBadge phase="discovery" />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Phase Badge')).toBeTruthy();
      expect(screen.getByText('A visual indicator of the current conversational phase.')).toBeTruthy();
    });

    it('should display phase progression information', async () => {
      const user = userEvent.setup();
      render(<PhaseBadge phase="discovery" />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Phase Progression')).toBeTruthy();
      expect(
        screen.getByText(
          /The initial phase where the AI assistant gathers information about the user's background, skills, and preferences./,
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /The phase where the AI assistant helps the user articulate their career goals and aspirations/,
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /The final phase where the AI assistant synthesizes the information and goals to generate personalized career recommendations./,
        ),
      ).toBeTruthy();
    });

    it('should display close button', async () => {
      const user = userEvent.setup();
      render(<PhaseBadge phase="discovery" />);

      const button = screen.getByRole('button');
      await user.click(button);

      const closeButton = screen.getByRole('button', { name: /Close/ });
      expect(closeButton).toBeTruthy();
    });

    it('should close sheet when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhaseBadge phase="discovery" />);

      const button = screen.getByRole('button', { name: /Current phase: Discovery/ });
      await user.click(button);

      expect(screen.getByText('Phase Badge')).toBeTruthy();

      const closeButton = screen.getByRole('button', { name: /Close/ });
      await user.click(closeButton);

      // After closing, the sheet content should be removed from the document
      const sheetTitle = screen.queryByText('Phase Badge');
      expect(sheetTitle).toBeNull();
    });
  });

  describe('css variants', () => {
    it('should apply correct color classes for discovery phase', () => {
      const { container } = render(<PhaseBadge phase="discovery" />);

      const badge = container.querySelector('[class*="bg-neutral"]');
      expect(badge).toBeTruthy();
    });

    it('should apply correct color classes for goalElicitation phase', () => {
      const { container } = render(<PhaseBadge phase="goalElicitation" />);

      const badge = container.querySelector('[class*="bg-blue"]');
      expect(badge).toBeTruthy();
    });

    it('should apply correct color classes for synthesis phase', () => {
      const { container } = render(<PhaseBadge phase="synthesis" />);

      const badge = container.querySelector('[class*="bg-green"]');
      expect(badge).toBeTruthy();
    });
  });

  describe('phase label text', () => {
    it('should render correct label for discovery phase', () => {
      render(<PhaseBadge phase="discovery" />);

      expect(screen.getByText('Discovery')).toBeTruthy();
    });

    it('should render correct label for goalElicitation phase', () => {
      render(<PhaseBadge phase="goalElicitation" />);

      expect(screen.getByText('Goal Elicitation')).toBeTruthy();
    });

    it('should render correct label for synthesis phase', () => {
      render(<PhaseBadge phase="synthesis" />);

      expect(screen.getByText('Synthesis')).toBeTruthy();
    });
  });
});
