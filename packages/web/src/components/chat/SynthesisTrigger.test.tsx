import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SynthesisTrigger } from './SynthesisTrigger';

describe('SynthesisTrigger', () => {
  describe('AC-01: Display conditions based on turnCount', () => {
    it('should not render when turnCount < MIN_TURNS_FOR_SYNTHESIS (3)', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={2}
          phase="discovery"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      expect(screen.queryByRole('button')).not.toBeTruthy();
    });

    it('should render when turnCount >= MIN_TURNS_FOR_SYNTHESIS (3)', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      expect(screen.queryByRole('button')).toBeTruthy();
    });

    it('should render when turnCount > MIN_TURNS_FOR_SYNTHESIS', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={5}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      expect(screen.queryByRole('button')).toBeTruthy();
    });
  });

  describe('AC-02: Button submission behavior', () => {
    it('should call onTrigger when button is clicked', async () => {
      const user = userEvent.setup();
      const onTrigger = vi.fn();

      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onTrigger).toHaveBeenCalledOnce();
    });

    it('should not call onTrigger when disabled due to submission', async () => {
      const onTrigger = vi.fn();

      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={true}
        />,
      );

      const button = screen.getByRole('button');
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });

    it('should display appropriate button text when not submitting', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toBe("I'm ready for recommendations");
    });

    it('should show "Generating..." when isSubmitting is true', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={true}
        />,
      );

      expect(screen.getByText('Generating...')).toBeTruthy();
    });
  });

  describe('AC-03: Hide when synthesis complete or in progress', () => {
    it('should not render when phase is synthesis', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={3}
          phase="synthesis"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      expect(screen.queryByRole('button')).not.toBeTruthy();
    });

    it('should not render when hasRecommendation is true', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={true}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      expect(screen.queryByRole('button')).not.toBeTruthy();
    });
  });

  describe('AC-05: Pulsing animation when synthesisReady', () => {
    it('should apply pulse animation classes when synthesisReady is true', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={true}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('animate-pulse');
    });

    it('should not apply pulse animation when synthesisReady is false', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      const button = screen.getByRole('button');
      expect(button.className).not.toContain('animate-pulse');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible aria-label', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Submit synthesis trigger to get recommendations');
    });

    it('should have title attribute for tooltip', () => {
      const onTrigger = vi.fn();
      render(
        <SynthesisTrigger
          turnCount={3}
          phase="goalElicitation"
          synthesisReady={false}
          hasRecommendation={false}
          onTrigger={onTrigger}
          isSubmitting={false}
        />,
      );

      const button = screen.getByRole('button');
      expect(button.getAttribute('title')).toBe('Click to receive personalized career recommendations');
    });
  });
});
