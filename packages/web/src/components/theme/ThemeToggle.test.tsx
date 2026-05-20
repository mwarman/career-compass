import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ThemeProvider } from '@/context/ThemeContext';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('AC-03: should render theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeDefined();
  });

  it('AC-03: should display sun icon when in dark mode', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });
    const svgs = button.querySelectorAll('svg');
    // Should have exactly one icon (sun) since we're showing what theme will be
    expect(svgs.length).toBe(1);
  });

  it('AC-03: should display moon icon when in light mode', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });
    const svgs = button.querySelectorAll('svg');
    // Should have exactly one icon (moon) since we're showing what theme will be
    expect(svgs.length).toBe(1);
  });

  it('AC-03: should toggle theme from dark to light when clicked', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="dark" storageKey="test-theme">
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });

    // Click to toggle from dark to light
    await user.click(button);

    // Verify theme changed
    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(localStorage.getItem('test-theme')).toBe('light');
    });
  });

  it('AC-03: should toggle theme from light to dark when clicked', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });

    // Click to toggle from light to dark
    await user.click(button);

    // Verify theme changed
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('test-theme')).toBe('dark');
    });
  });
});
