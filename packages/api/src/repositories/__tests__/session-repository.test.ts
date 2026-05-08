import { SessionState } from '@career-compass/shared';

import { RepositoryError } from '../repository-error';

// Mock the AWS SDK modules and config before importing session-repository
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('../../utils/config');

// Setup mocks before requiring the module
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb') as any;

let mockSend: jest.Mock<Promise<unknown>, [unknown]>;
const mockDocClient = {
  get send() {
    return mockSend;
  },
};

// Mock DynamoDBDocumentClient.from to return our mock client
DynamoDBDocumentClient.from = jest.fn(() => mockDocClient);

// Now require the session repository so it uses the mocked modules
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sessionRepoModule = require('../session-repository');

describe('SessionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend = jest.fn<Promise<unknown>, [unknown]>();
  });

  describe('createSession', () => {
    it('should create a session with all required fields and TTL', async () => {
      const seed: Partial<SessionState> = {
        sessionId: 'session-123',
        phase: 'discovery',
        turnCount: 0,
        history: [],
      };

      mockSend.mockResolvedValue({});

      const before = Math.floor(Date.now() / 1000);
      const session = await sessionRepoModule.SessionRepository.createSession(seed);
      const after = Math.floor(Date.now() / 1000);

      expect(session.sessionId).toBe('session-123');
      expect(session.phase).toBe('discovery');
      expect(session.turnCount).toBe(0);
      expect(session.history).toEqual([]);
      expect(session.createdAt).toBeGreaterThan(0);

      // TTL should be approximately 24 hours from now (86400 seconds)
      expect(session.ttl).toBeGreaterThanOrEqual(before + 86400);
      expect(session.ttl).toBeLessThanOrEqual(after + 86400);
    });

    it('should generate sessionId if not provided', async () => {
      mockSend.mockResolvedValue({});

      const session = await sessionRepoModule.SessionRepository.createSession({});

      expect(session.sessionId).toBeDefined();
      expect(session.sessionId.length).toBeGreaterThan(0);
    });

    it('should set default phase to discovery', async () => {
      mockSend.mockResolvedValue({});

      const session = await sessionRepoModule.SessionRepository.createSession({});

      expect(session.phase).toBe('discovery');
    });

    it('should set turnCount to 0 by default', async () => {
      mockSend.mockResolvedValue({});

      const session = await sessionRepoModule.SessionRepository.createSession({});

      expect(session.turnCount).toBe(0);
    });

    it('should throw RepositoryError on DynamoDB error', async () => {
      const error = new Error('DynamoDB connection failed');
      mockSend.mockRejectedValue(error);

      await expect(sessionRepoModule.SessionRepository.createSession({})).rejects.toThrow(RepositoryError);
      await expect(sessionRepoModule.SessionRepository.createSession({})).rejects.toMatchObject({
        operation: 'createSession',
        cause: error,
      });
    });
  });

  describe('getSession', () => {
    it('should return session if it exists', async () => {
      const mockSession: SessionState = {
        sessionId: 'session-123',
        phase: 'goalElicitation',
        turnCount: 3,
        history: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
        ],
        createdAt: 1000000,
        ttl: 2000000,
      };

      mockSend.mockResolvedValue({ Item: mockSession });

      const session = await sessionRepoModule.SessionRepository.getSession('session-123');

      expect(session).toEqual(mockSession);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return null if session does not exist', async () => {
      mockSend.mockResolvedValue({ Item: undefined });

      const session = await sessionRepoModule.SessionRepository.getSession('session-nonexistent');

      expect(session).toBeNull();
    });

    it('should throw RepositoryError on DynamoDB error', async () => {
      const error = new Error('DynamoDB connection failed');
      mockSend.mockRejectedValue(error);

      await expect(sessionRepoModule.SessionRepository.getSession('session-123')).rejects.toThrow(RepositoryError);
      await expect(sessionRepoModule.SessionRepository.getSession('session-123')).rejects.toMatchObject({
        operation: 'getSession',
        cause: error,
      });
    });

    it('should throw RepositoryError if item does not match schema', async () => {
      const invalidSession = {
        sessionId: 'session-123',
        // Missing required fields
      };

      mockSend.mockResolvedValue({ Item: invalidSession });

      await expect(sessionRepoModule.SessionRepository.getSession('session-123')).rejects.toThrow(RepositoryError);
    });
  });

  describe('updateSession', () => {
    it('should update phase and turnCount', async () => {
      const updates: Partial<SessionState> = {
        phase: 'synthesis',
        turnCount: 5,
      };

      const updatedSession: SessionState = {
        sessionId: 'session-123',
        phase: 'synthesis',
        turnCount: 5,
        history: [],
        createdAt: 1000000,
        ttl: 2000000,
      };

      mockSend.mockResolvedValue({ Attributes: updatedSession });

      const session = await sessionRepoModule.SessionRepository.updateSession('session-123', updates);

      expect(session.phase).toBe('synthesis');
      expect(session.turnCount).toBe(5);

      expect(mockSend).toHaveBeenCalled();
    });

    it('should append to history array', async () => {
      const newMessage: SessionState['history'] = [
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' } as Record<string, unknown>],
        },
      ];

      const updatedSession: SessionState = {
        sessionId: 'session-123',
        phase: 'goalElicitation',
        turnCount: 2,
        history: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
          ...newMessage,
        ],
        createdAt: 1000000,
        ttl: 2000000,
      };

      mockSend.mockResolvedValue({ Attributes: updatedSession });

      const session = await sessionRepoModule.SessionRepository.updateSession('session-123', {
        history: newMessage,
      });

      expect(session.history).toContainEqual(newMessage[0]);
      expect(session.history.length).toBeGreaterThan(1);
    });

    it('should refresh TTL on every update', async () => {
      const oldTTL = 1000000;
      const updates: Partial<SessionState> = {
        turnCount: 1,
      };

      const before = Math.floor(Date.now() / 1000) + 86400;

      const updatedSession: SessionState = {
        sessionId: 'session-123',
        phase: 'discovery',
        turnCount: 1,
        history: [],
        createdAt: 1000000,
        ttl: before,
      };

      mockSend.mockResolvedValue({ Attributes: updatedSession });

      const session = await sessionRepoModule.SessionRepository.updateSession('session-123', updates);

      expect(session.ttl).toBeGreaterThan(oldTTL);
      expect(session.ttl).toBeGreaterThanOrEqual(before);
    });

    it('should only update TTL if no other fields provided', async () => {
      const currentSession: SessionState = {
        sessionId: 'session-123',
        phase: 'discovery',
        turnCount: 0,
        history: [],
        createdAt: 1000000,
        ttl: 1000000,
      };

      mockSend.mockResolvedValue({ Item: currentSession });

      const before = Math.floor(Date.now() / 1000) + 86400;
      const session = await sessionRepoModule.SessionRepository.updateSession('session-123', {});
      const after = Math.floor(Date.now() / 1000) + 86400;

      expect(session.sessionId).toBe('session-123');
      expect(session.ttl).toBeGreaterThanOrEqual(before);
      expect(session.ttl).toBeLessThanOrEqual(after);
    });

    it('should throw RepositoryError if session not found', async () => {
      mockSend.mockResolvedValue({ Item: null });

      await expect(
        sessionRepoModule.SessionRepository.updateSession('session-nonexistent', { turnCount: 1 }),
      ).rejects.toThrow(RepositoryError);
    });

    it('should throw RepositoryError on DynamoDB error', async () => {
      const error = new Error('DynamoDB connection failed');
      mockSend.mockRejectedValue(error);

      await expect(sessionRepoModule.SessionRepository.updateSession('session-123', { turnCount: 1 })).rejects.toThrow(
        RepositoryError,
      );
      await expect(
        sessionRepoModule.SessionRepository.updateSession('session-123', { turnCount: 1 }),
      ).rejects.toMatchObject({
        operation: 'updateSession',
        cause: error,
      });
    });

    it('should throw RepositoryError if updated item does not match schema', async () => {
      const invalidSession = {
        sessionId: 'session-123',
        // Missing required fields
      };

      mockSend.mockResolvedValue({ Attributes: invalidSession });

      await expect(sessionRepoModule.SessionRepository.updateSession('session-123', { turnCount: 1 })).rejects.toThrow(
        RepositoryError,
      );
    });
  });

  describe('TTL calculation', () => {
    it('should set TTL to approximately 24 hours in the future', async () => {
      mockSend.mockResolvedValue({});

      const beforeMs = Date.now();
      const beforeSeconds = Math.floor(beforeMs / 1000);

      const session = await sessionRepoModule.SessionRepository.createSession({
        sessionId: 'test-ttl',
      });

      const afterMs = Date.now();
      const afterSeconds = Math.floor(afterMs / 1000);

      const expectedTTLMin = beforeSeconds + 86400; // 24 hours
      const expectedTTLMax = afterSeconds + 86400;

      expect(session.ttl).toBeGreaterThanOrEqual(expectedTTLMin);
      expect(session.ttl).toBeLessThanOrEqual(expectedTTLMax);
    });
  });

  describe('error handling', () => {
    it('should wrap validation errors as RepositoryError', async () => {
      mockSend.mockResolvedValue({ Item: {} });

      await expect(sessionRepoModule.SessionRepository.getSession('session-123')).rejects.toThrow(RepositoryError);
    });

    it('RepositoryError should have operation name', async () => {
      mockSend.mockRejectedValue(new Error('Test error'));

      try {
        await sessionRepoModule.SessionRepository.createSession({});
        fail('Should have thrown RepositoryError');
      } catch (error) {
        expect(error).toBeInstanceOf(RepositoryError);
        expect((error as RepositoryError).operation).toBe('createSession');
      }
    });

    it('RepositoryError should preserve original cause', async () => {
      const originalError = new Error('Original DynamoDB error');
      mockSend.mockRejectedValue(originalError);

      try {
        await sessionRepoModule.SessionRepository.createSession({});
        fail('Should have thrown RepositoryError');
      } catch (error) {
        expect((error as RepositoryError).cause).toBe(originalError);
      }
    });
  });
});
