/**
 * Vitest setup file for @career-compass/web package.
 * Configures the test environment with testing utilities and mocks.
 */

import { vi } from 'vitest';

// Mock scrollIntoView for jsdom - required since jsdom doesn't implement it
Element.prototype.scrollIntoView = vi.fn();

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Set environment variables for testing
process.env.VITE_API_BASE_URL = 'http://localhost:3000';
process.env.MODE = 'development';
