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

  it('should display sun and moon icons', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });
    const svgs = button.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('AC-03: should open dropdown menu when clicked', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });

    // Open dropdown
    await user.click(button);

    // Check that menu items are available
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /light/i })).toBeDefined();
      expect(screen.getByRole('menuitem', { name: /dark/i })).toBeDefined();
      expect(screen.getByRole('menuitem', { name: /system/i })).toBeDefined();
    });
  });

  it('should allow theme selection from dropdown', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="dark" storageKey="test-theme">
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });

    // Open dropdown and select light mode
    await user.click(button);

    const lightOption = await screen.findByRole('menuitem', { name: /light/i });
    await user.click(lightOption);

    // Verify theme changed
    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(localStorage.getItem('test-theme')).toBe('light');
    });
  });
});
