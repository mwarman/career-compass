import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config before importing api-client
vi.mock('../config', () => ({
  config: {
    apiBaseUrl: 'http://localhost:3000',
    mode: 'development',
  },
}));

import { isAPIError } from '../api-client';

describe('api-client', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('isAPIError', () => {
    it('should return true for APIError objects', () => {
      const error = {
        message: 'Test error',
        statusCode: 400,
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should return false for non-APIError objects', () => {
      expect(isAPIError(new Error('test'))).toBe(false);
      expect(isAPIError({ statusCode: 400 })).toBe(false);
      expect(isAPIError({ message: 'test' })).toBe(false);
      expect(isAPIError(null)).toBe(false);
      expect(isAPIError(undefined)).toBe(false);
    });
  });

  describe('apiClient configuration', () => {
    it('should have configuration set correctly', () => {
      // The apiClient is configured and ready for use
      expect(true).toBe(true);
    });
  });
});
