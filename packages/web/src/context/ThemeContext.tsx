import { createContext, JSX, ReactNode, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * ThemeProvider component - manages dark/light theme state and applies it to the document.
 * Loads theme from localStorage first, then detects system preference via prefers-color-scheme media query,
 * and falls back to 'dark' as the final default.
 * Persists user preference to localStorage.
 */
export const ThemeProvider = ({
  children,
  defaultTheme = 'dark',
  storageKey = 'career-compass-theme',
  ...props
}: ThemeProviderProps): JSX.Element => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Priority 1: Check localStorage
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored && (stored === 'dark' || stored === 'light')) {
      return stored;
    }

    // Priority 2: Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    // Priority 3: Default to provided defaultTheme or 'dark'
    return defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

/**
 * useTheme hook - access theme state and setTheme function.
 * Must be used within a ThemeProvider.
 */
export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
