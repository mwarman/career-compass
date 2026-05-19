import { Moon, Sun } from 'lucide-react';
import { JSX } from 'react';

import { Button } from '@/components/shadcn/button';
import { useTheme } from '@/context/ThemeContext';

/**
 * ThemeToggle component - simple toggle button to switch between dark and light themes.
 * Icon shows what the theme WILL be if the button is clicked (inverse of current theme).
 * Located in the application header.
 */
export const ThemeToggle = (): JSX.Element => {
  const { theme, setTheme } = useTheme();

  const handleToggle = (): void => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleToggle} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
      <span className="sr-only">Toggle to {theme === 'dark' ? 'light' : 'dark'} mode</span>
    </Button>
  );
};
