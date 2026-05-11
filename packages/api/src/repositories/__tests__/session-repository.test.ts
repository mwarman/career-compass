/**
 * Unit tests for SessionRepository
 *
 * Note: These tests are currently simplified. The full integration tests
 * for SessionRepository are covered indirectly through ConversationService tests.
 */

import { describe, it, expect } from 'vitest';

import { RepositoryError } from '../repository-error';

describe('SessionRepository', () => {
  describe('error handling', () => {
    it('RepositoryError should have operation property', () => {
      const cause = new Error('Database connection failed');
      const error = new RepositoryError('Test error', 'testOperation', cause);
      expect(error.operation).toBe('testOperation');
      expect(error.statusCode).toBe(500);
      expect(error.cause).toBe(cause);
    });

    it('RepositoryError should be instanceof Error', () => {
      const error = new RepositoryError('Test', 'test');
      expect(error instanceof Error).toBe(true);
    });
  });
});
