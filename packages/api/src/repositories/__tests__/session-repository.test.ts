/**
 * Unit tests for SessionRepository
 *
 * Tests the repository layer with mocked DynamoDB to ensure no AWS resource access.
 */

import { SessionState } from '@career-compass/shared';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock variables using vi.hoisted() to ensure they're available in vi.mock()
const { mockDocClientSend } = vi.hoisted(() => ({
  mockDocClientSend: vi.fn(),
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockGetCommand = vi.fn(function (this: Record<string, unknown>, input: any) {
    Object.assign(this, input);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockPutCommand = vi.fn(function (this: Record<string, unknown>, input: any) {
    Object.assign(this, input);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockUpdateCommand = vi.fn(function (this: Record<string, unknown>, input: any) {
    Object.assign(this, input);
  });

  return {
    DynamoDBDocumentClient: {
      from: vi.fn(() => ({
        send: mockDocClientSend,
      })),
    },
    GetCommand: MockGetCommand,
    PutCommand: MockPutCommand,
    UpdateCommand: MockUpdateCommand,
  };
});

vi.mock('../../utils/logger');

// Import after mocking AWS SDK
import { RepositoryError } from '../repository-error';
import { SessionRepository } from '../session-repository';

describe('SessionRepository', () => {
  const mockSessionState: SessionState = {
    sessionId: 'test-session-123',
    phase: 'discovery',
    turnCount: 0,
    history: [],
    createdAt: Date.now(),
    ttl: Math.floor(Date.now() / 1000) + 86400,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocClientSend.mockClear();
  });

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

  describe('getSession()', () => {
    it('should retrieve a session successfully when it exists', async () => {
      // Arrange
      mockDocClientSend.mockResolvedValue({
        Item: mockSessionState,
      });

      // Act
      const result = await SessionRepository.getSession(mockSessionState.sessionId);

      // Assert
      expect(result).toEqual(mockSessionState);
      expect(mockDocClientSend).toHaveBeenCalled();
    });

    it('should return null when session does not exist', async () => {
      // Arrange
      mockDocClientSend.mockResolvedValue({});

      // Act
      const result = await SessionRepository.getSession('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw RepositoryError when DynamoDB call fails', async () => {
      // Arrange
      const dbError = new Error('DynamoDB connection failed');
      mockDocClientSend.mockRejectedValue(dbError);

      // Act & Assert
      await expect(SessionRepository.getSession(mockSessionState.sessionId)).rejects.toThrow(RepositoryError);
    });
  });

  describe('createSession()', () => {
    it('should create a session with provided seed data', async () => {
      // Arrange
      mockDocClientSend.mockResolvedValue({});
      const seed: Partial<SessionState> = {
        sessionId: mockSessionState.sessionId,
        phase: 'discovery',
      };

      // Act
      const result = await SessionRepository.createSession(seed);

      // Assert
      expect(result).toBeDefined();
      expect(result.sessionId).toBe(mockSessionState.sessionId);
      expect(result.phase).toBe('discovery');
      expect(result.ttl).toBeGreaterThan(0);
      expect(mockDocClientSend).toHaveBeenCalled();
    });

    it('should generate sessionId if not provided in seed', async () => {
      // Arrange
      mockDocClientSend.mockResolvedValue({});

      // Act
      const result = await SessionRepository.createSession({});

      // Assert
      expect(result.sessionId).toBeDefined();
      expect(result.sessionId.length).toBeGreaterThan(0);
    });

    it('should throw RepositoryError when DynamoDB call fails', async () => {
      // Arrange
      const dbError = new Error('DynamoDB write failed');
      mockDocClientSend.mockRejectedValue(dbError);

      // Act & Assert
      await expect(SessionRepository.createSession({})).rejects.toThrow(RepositoryError);
    });
  });

  describe('updateSession()', () => {
    it('should update a session successfully', async () => {
      // Arrange
      mockDocClientSend.mockResolvedValue({
        Attributes: {
          ...mockSessionState,
          turnCount: 1,
        },
      });

      const updates = {
        turnCount: 1,
        phase: 'goalElicitation' as const,
      };

      // Act
      const result = await SessionRepository.updateSession(mockSessionState.sessionId, updates);

      // Assert
      expect(result).toBeDefined();
      expect(mockDocClientSend).toHaveBeenCalled();
    });

    it('should throw RepositoryError when DynamoDB call fails', async () => {
      // Arrange
      const dbError = new Error('DynamoDB update failed');
      mockDocClientSend.mockRejectedValue(dbError);

      // Act & Assert
      await expect(SessionRepository.updateSession(mockSessionState.sessionId, { turnCount: 1 })).rejects.toThrow(
        RepositoryError,
      );
    });
  });
});
