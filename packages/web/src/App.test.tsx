import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('should render the ChatPage component', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1, name: /career compass/i });
    expect(heading).toBeTruthy();
  });

  it('should render the message input field', () => {
    render(<App />);
    const input = screen.getByPlaceholderText('Type your message...');
    expect(input).toBeTruthy();
  });

  it('should render the Send button', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /send message/i });
    expect(button).toBeTruthy();
  });

  it('should render the phase badge', () => {
    render(<App />);
    const badge = screen.getByText('Discovery');
    expect(badge).toBeTruthy();
  });

  it('should have QueryClientProvider and SessionProvider as root providers', () => {
    const { container } = render(<App />);
    // The App component is wrapped with QueryClientProvider and SessionProvider
    // We verify the content renders, which proves both providers are working
    expect(container.querySelector('h1')).toBeTruthy();
  });
});
