import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SeedMessage } from './SeedMessage';

describe('SeedMessage', () => {
  it('should render the welcome heading', () => {
    render(<SeedMessage />);
    expect(screen.getByText('Welcome to Career Compass')).toBeTruthy();
  });

  it('should display the seed input description', () => {
    render(<SeedMessage />);
    expect(screen.getByText(/Share your current professional context/)).toBeTruthy();
  });

  it('should display instructions for what to share', () => {
    render(<SeedMessage />);
    expect(screen.getByText(/Your current role and experience level/)).toBeTruthy();
    expect(screen.getByText(/Technologies or skills you currently use/)).toBeTruthy();
    expect(screen.getByText(/Your career goals and aspirations/)).toBeTruthy();
  });

  it('should display hint about pressing Enter to submit', () => {
    render(<SeedMessage />);
    expect(screen.getByText(/Press Enter to submit your message/)).toBeTruthy();
  });
});
