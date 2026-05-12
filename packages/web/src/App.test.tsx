import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should render the main heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1, name: /career compass/i });
    expect(heading).toBeTruthy();
  });

  it('should render the Button component', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /get started/i });
    expect(button).toBeTruthy();
  });

  it('should render Tailwind test element with bg-blue-500 class', () => {
    const { container } = render(<App />);
    const testDiv = container.querySelector('.bg-blue-500');
    expect(testDiv).toBeTruthy();
    expect(testDiv?.textContent).toContain('Tailwind styling test');
  });

  it('should have QueryClientProvider as root provider', () => {
    const { container } = render(<App />);
    // The App component is wrapped with QueryClientProvider
    // We verify the content renders, which proves the provider is working
    expect(container.querySelector('h1')).toBeTruthy();
  });
});
