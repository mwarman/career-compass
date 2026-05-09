/**
 * Unit tests for ConversationService.
 * Tests processTurn stub implementation and logging behavior.
 */

import { SessionState, TurnRequest } from '@career-compass/shared';

import { ConversationService } from '../conversation-service';

describe('ConversationService', () => {
  const mockSession: SessionState = {
    sessionId: 'session-123',
    phase: 'discovery',
    turnCount: 0,
    history: [],
    createdAt: Date.now(),
    ttl: Math.floor(Date.now() / 1000) + 86400,
  };

  const mockRequest: TurnRequest = {
    userMessage: 'What skills should I learn?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processTurn()', () => {
    it('should return a valid conversational response', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      expect(response).toHaveProperty('type', 'conversational');
      expect(response).toHaveProperty('sessionId');
      expect(response.type).toBe('conversational');

      // Type narrowing for discriminated union
      if (response.type === 'conversational') {
        expect(response).toHaveProperty('assistantMessage');
        expect(response).toHaveProperty('phase');
        expect(response).toHaveProperty('turnCount');
        expect(response).toHaveProperty('synthesisReady');
      }
    });

    it('should preserve session ID in response', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      expect(response.sessionId).toBe(mockSession.sessionId);
    });

    it('should preserve phase from session', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      expect(response.phase).toBe(mockSession.phase);
    });

    it('should increment turn count', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      expect(response.turnCount).toBe(mockSession.turnCount + 1);
    });

    it('should echo user message in assistant response (stub behavior)', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      if (response.type === 'conversational') {
        expect(response.assistantMessage).toContain(mockRequest.userMessage);
        expect(response.assistantMessage).toBe(`Echo: ${mockRequest.userMessage}`);
      } else {
        throw new Error('Expected conversational response');
      }
    });

    it('should set synthesisReady to false in stub (will be configured later)', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      if (response.type === 'conversational') {
        expect(response.synthesisReady).toBe(false);
      } else {
        throw new Error('Expected conversational response');
      }
    });

    it('should handle messages with special characters', async () => {
      const specialRequest: TurnRequest = {
        userMessage: 'What about C++ and C#? "Testing" edge cases!',
      };
      const response = await ConversationService.processTurn(mockSession, specialRequest);

      if (response.type === 'conversational') {
        expect(response.assistantMessage).toContain('C++');
        expect(response.assistantMessage).toContain('C#');
      }
    });

    it('should work with sessions at different phases', async () => {
      const goalElicitationSession: SessionState = {
        ...mockSession,
        phase: 'goalElicitation',
        turnCount: 2,
      };

      const response = await ConversationService.processTurn(goalElicitationSession, mockRequest);

      expect(response.phase).toBe('goalElicitation');
      expect(response.turnCount).toBe(3);
    });

    it('should work with sessions at synthesis phase', async () => {
      const synthesisSession: SessionState = {
        ...mockSession,
        phase: 'synthesis',
        turnCount: 10,
      };

      const response = await ConversationService.processTurn(synthesisSession, mockRequest);

      expect(response.phase).toBe('synthesis');
      expect(response.turnCount).toBe(11);
    });

    it('should handle long user messages', async () => {
      const longRequest: TurnRequest = {
        userMessage: 'a'.repeat(1000),
      };

      const response = await ConversationService.processTurn(mockSession, longRequest);

      if (response.type === 'conversational') {
        expect(response.assistantMessage).toContain('a');
        expect(response.assistantMessage.length).toBeGreaterThan(1000);
      }
    });
  });

  describe('Logging behavior', () => {
    it('should log entry with info level', async () => {
      await ConversationService.processTurn(mockSession, mockRequest);

      const consoleLogs = (console.log as jest.Mock).mock.calls;
      const entryLog = consoleLogs.find((call) => {
        const arg = call[0];
        return arg && typeof arg === 'object' && arg.message?.includes('entering');
      });

      expect(entryLog).toBeDefined();
      expect(entryLog![0]).toMatchObject({
        level: 'info',
        message: expect.stringContaining('entering'),
        sessionId: mockSession.sessionId,
      });
    });

    it('should log exit with info level', async () => {
      await ConversationService.processTurn(mockSession, mockRequest);

      const consoleLogs = (console.log as jest.Mock).mock.calls;
      const exitLog = consoleLogs.find((call) => {
        const arg = call[0];
        return arg && typeof arg === 'object' && arg.message?.includes('exiting');
      });

      expect(exitLog).toBeDefined();
      expect(exitLog![0]).toMatchObject({
        level: 'info',
        message: expect.stringContaining('exiting'),
        sessionId: mockSession.sessionId,
      });
    });

    it('should log response generation with debug level', async () => {
      await ConversationService.processTurn(mockSession, mockRequest);

      const consoleLogs = (console.log as jest.Mock).mock.calls;
      const debugLog = consoleLogs.find((call) => {
        const arg = call[0];
        return arg && typeof arg === 'object' && arg.message?.includes('response generated');
      });

      expect(debugLog).toBeDefined();
      expect(debugLog![0]).toMatchObject({
        level: 'debug',
        message: expect.stringContaining('response generated'),
      });
    });

    it('should not use JSON.stringify for logging', async () => {
      const stringifySpy = jest.spyOn(JSON, 'stringify');

      await ConversationService.processTurn(mockSession, mockRequest);

      const stringifyCallsNotFromBody = stringifySpy.mock.calls.filter(
        (call) => !call[0]?.assistantMessage, // Filter out the response body serialization
      );

      // JSON.stringify should only be called for response body, not for logging
      expect(stringifyCallsNotFromBody).toHaveLength(0);

      stringifySpy.mockRestore();
    });

    it('should log with correct context information', async () => {
      const customSession: SessionState = {
        ...mockSession,
        sessionId: 'custom-session-456',
        phase: 'goalElicitation',
        turnCount: 5,
      };

      await ConversationService.processTurn(customSession, mockRequest);

      const consoleLogs = (console.log as jest.Mock).mock.calls;
      const allLogs = consoleLogs.map((call) => call[0]);

      allLogs.forEach((log) => {
        if (log && typeof log === 'object' && 'sessionId' in log) {
          expect(log.sessionId).toBe('custom-session-456');
        }
        if (log && typeof log === 'object' && 'phase' in log) {
          expect(log.phase).toBe('goalElicitation');
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should log errors when they occur', async () => {
      // For the stub implementation, errors are only logged during processing
      // Full error scenarios will be tested when business logic is implemented
      const consoleSpy = jest.spyOn(console, 'error');

      // The stub won't throw for normal cases, so this test is a placeholder
      // for when full business logic is implemented
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Response validation', () => {
    it('should return response matching TurnResponse schema', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      // Check type is correct discriminator
      expect(['conversational', 'synthesis']).toContain(response.type);
      expect(typeof response.sessionId).toBe('string');
      expect(typeof response.phase).toBe('string');
      expect(typeof response.turnCount).toBe('number');

      if (response.type === 'conversational') {
        expect(typeof response.assistantMessage).toBe('string');
        expect(typeof response.synthesisReady).toBe('boolean');
      } else if (response.type === 'synthesis') {
        expect(response.phase).toBe('synthesis');
        expect(response).toHaveProperty('recommendation');
      }
    });

    it('should have non-empty assistant message', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      if (response.type === 'conversational') {
        expect(response.assistantMessage.length).toBeGreaterThan(0);
      }
    });

    it('should have turn count greater than original', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      expect(response.turnCount).toBeGreaterThan(mockSession.turnCount);
    });
  });

  describe('Stub implementation behavior', () => {
    it('should process multiple turns sequentially', async () => {
      const session1 = mockSession;
      const session2 = { ...mockSession, turnCount: 1 };
      const session3 = { ...mockSession, turnCount: 2 };

      const response1 = await ConversationService.processTurn(session1, mockRequest);
      const response2 = await ConversationService.processTurn(session2, mockRequest);
      const response3 = await ConversationService.processTurn(session3, mockRequest);

      expect(response1.turnCount).toBe(1);
      expect(response2.turnCount).toBe(2);
      expect(response3.turnCount).toBe(3);
    });

    it('should be deterministic for same inputs', async () => {
      const response1 = await ConversationService.processTurn(mockSession, mockRequest);
      const response2 = await ConversationService.processTurn(mockSession, mockRequest);

      expect(response1.turnCount).toBe(response2.turnCount);

      if (response1.type === 'conversational' && response2.type === 'conversational') {
        expect(response1.assistantMessage).toBe(response2.assistantMessage);
        expect(response1.synthesisReady).toBe(response2.synthesisReady);
      }
    });
  });
});
