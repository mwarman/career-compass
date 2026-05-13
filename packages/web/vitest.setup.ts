/**
 * Vitest setup file for @career-compass/web package.
 * Configures the test environment with testing utilities and mocks.
 */

import { vi } from 'vitest';

// Mock scrollIntoView for jsdom - required since jsdom doesn't implement it
Element.prototype.scrollIntoView = vi.fn();

// Set environment variables for testing
process.env.VITE_API_BASE_URL = 'http://localhost:3000';
process.env.MODE = 'development';
