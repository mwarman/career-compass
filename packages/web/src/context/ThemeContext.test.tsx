import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ThemeProvider, useTheme } from '@/context/ThemeContext';

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('AC-01: should display system preferred mode if available', async () => {
    const mockMatchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia;

    render(
      <ThemeProvider defaultTheme="system">
        <div>Test</div>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('AC-02: should display dark mode if no system preference is set', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <div>Test</div>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('should apply light class when theme is set to light', async () => {
    function TestComponent() {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme('light')}>Set Light</button>;
    }

    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /set light/i });
    button.click();

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  it('should persist theme preference to localStorage', async () => {
    function TestComponent() {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme('light')}>Set Light</button>;
    }

    render(
      <ThemeProvider defaultTheme="dark" storageKey="test-theme">
        <TestComponent />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: /set light/i });
    button.click();

    await waitFor(() => {
      expect(localStorage.getItem('test-theme')).toBe('light');
    });
  });

  it('should retrieve theme from localStorage on initialization', async () => {
    localStorage.setItem('test-theme', 'light');

    render(
      <ThemeProvider defaultTheme="dark" storageKey="test-theme">
        <div>Test</div>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });
});
