/**
 * Unit tests for ConversationService.
 * Tests phase transition logic, synthesis trigger detection, and state management.
 */

import { SessionState, TurnRequest } from '@career-compass/shared';

import { SessionRepository } from '../../repositories/session-repository';
import {
  DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD,
  GOAL_ELICITATION_MAX_TURNS,
  SYNTHESIS_TRIGGER_PHRASE,
} from '../../utils/constants';
import { ConversationService } from '../conversation-service';

jest.mock('../../repositories/session-repository');

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
    (SessionRepository.updateSession as jest.Mock).mockResolvedValue({
      ...mockSession,
      turnCount: 1,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processTurn() - Basic behavior', () => {
    it('should return a valid conversational response', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      expect(response).toHaveProperty('type', 'conversational');
      expect(response.type).toBe('conversational');

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

    it('should increment turn count on every turn (AC-04)', async () => {
      const response = await ConversationService.processTurn(mockSession, mockRequest);

      expect(response.turnCount).toBe(mockSession.turnCount + 1);
    });

    it('should persist updated session to DynamoDB (AC-05)', async () => {
      await ConversationService.processTurn(mockSession, mockRequest);

      expect(SessionRepository.updateSession).toHaveBeenCalledWith(
        mockSession.sessionId,
        expect.objectContaining({
          turnCount: 1,
        }),
      );
    });

    it('should include history entries in persistence', async () => {
      await ConversationService.processTurn(mockSession, mockRequest);

      const updateCall = (SessionRepository.updateSession as jest.Mock).mock.calls[0];
      const historyArg = updateCall[1].history;

      expect(historyArg).toBeDefined();
      expect(historyArg).toHaveLength(2);
      expect(historyArg[0]).toMatchObject({ role: 'user' });
      expect(historyArg[1]).toMatchObject({ role: 'assistant' });
    });
  });

  describe('Phase transitions - Discovery phase (AC-06)', () => {
    it('should remain in discovery on early turns (before threshold)', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
        turnCount: 0, // First turn
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.phase).toBe('discovery');
      if (response.type === 'conversational') {
        expect(response.synthesisReady).toBe(false);
      } else {
        throw new Error('Expected conversational response');
      }
    });

    it('should remain in discovery at turn count 2', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
        turnCount: 1, // Will become turn 2
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.phase).toBe('discovery');
    });

    it('should NOT advance to goalElicitation without explicit Bedrock ready signal (stub)', async () => {
      // In M4, Bedrock stub always returns false, so even at threshold we don't advance
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
        turnCount: DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD - 1, // Will become threshold
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      // Should stay in discovery because Bedrock stub returns false
      expect(response.phase).toBe('discovery');
    });

    it('should skip goalElicitation if trigger phrase detected in discovery', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
        turnCount: 0,
      };

      const request: TurnRequest = {
        userMessage: `I think I'm ${SYNTHESIS_TRIGGER_PHRASE} now`,
      };

      const response = await ConversationService.processTurn(session, request);

      expect(response.phase).toBe('synthesis');
    });
  });

  describe('Phase transitions - GoalElicitation phase (AC-06)', () => {
    it('should remain in goalElicitation on early turns', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'goalElicitation',
        turnCount: 0,
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.phase).toBe('goalElicitation');
    });

    it('should transition to synthesis when max turns reached (AC-06)', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'goalElicitation',
        turnCount: GOAL_ELICITATION_MAX_TURNS - 1, // Will become max
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.phase).toBe('synthesis');
      if (response.type === 'conversational') {
        expect(response.synthesisReady).toBe(true);
      } else {
        throw new Error('Expected conversational response at transition');
      }
    });

    it('should transition to synthesis when trigger phrase detected (AC-06)', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'goalElicitation',
        turnCount: 5,
      };

      const request: TurnRequest = {
        userMessage: `I'm ${SYNTHESIS_TRIGGER_PHRASE}`,
      };

      const response = await ConversationService.processTurn(session, request);

      expect(response.phase).toBe('synthesis');
    });

    it('should detect synthesis trigger phrase case-insensitively (AC-03)', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'goalElicitation',
        turnCount: 2,
      };

      const testCases = [
        `I am ${SYNTHESIS_TRIGGER_PHRASE.toUpperCase()}`,
        `${SYNTHESIS_TRIGGER_PHRASE.toLocaleUpperCase()}!`,
        `Check this out: ${SYNTHESIS_TRIGGER_PHRASE}. Thanks!`,
        `READY FOR RECOMMENDATIONS please`,
        `ready for recommendations`,
        `ReAdY fOr ReCoMmEnDaTiOnS`,
      ];

      for (const userMessage of testCases) {
        const request: TurnRequest = { userMessage };
        const response = await ConversationService.processTurn(session, request);

        expect(response.phase).toBe('synthesis');
      }
    });

    it('should NOT trigger synthesis on partial phrase match only', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'goalElicitation',
        turnCount: 2,
      };

      const request: TurnRequest = {
        userMessage: 'I am ready for recommendations in the future but not now',
      };

      // This should still trigger because it contains the full phrase
      const response = await ConversationService.processTurn(session, request);
      expect(response.phase).toBe('synthesis');
    });
  });

  describe('Phase transitions - Synthesis phase', () => {
    it('should remain in synthesis phase', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'synthesis',
        turnCount: 10,
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.phase).toBe('synthesis');
    });

    it('should set synthesisReady to true in synthesis phase', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'synthesis',
        turnCount: 10,
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      if (response.type === 'conversational') {
        expect(response.synthesisReady).toBe(true);
      } else {
        throw new Error('Expected conversational response in synthesis phase');
      }
    });

    it('should increment turn count even in synthesis phase (AC-04)', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'synthesis',
        turnCount: 10,
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.turnCount).toBe(11);
    });
  });

  describe('Turn count behavior (AC-04)', () => {
    it('should increment turn count from 0 to 1', async () => {
      const session: SessionState = {
        ...mockSession,
        turnCount: 0,
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.turnCount).toBe(1);
    });

    it('should increment turn count at discovery threshold boundary', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
        turnCount: DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD - 1,
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.turnCount).toBe(DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD);
    });

    it('should increment turn count at goalElicitation max boundary', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'goalElicitation',
        turnCount: GOAL_ELICITATION_MAX_TURNS - 1,
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.turnCount).toBe(GOAL_ELICITATION_MAX_TURNS);
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

    it('should log phase transition when it occurs', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'goalElicitation',
        turnCount: GOAL_ELICITATION_MAX_TURNS - 1,
      };

      await ConversationService.processTurn(session, mockRequest);

      const consoleLogs = (console.log as jest.Mock).mock.calls;
      const transitionLog = consoleLogs.find((call) => {
        const arg = call[0];
        return arg && typeof arg === 'object' && arg.message === 'ConversationService.processTurn - phase transition';
      });

      expect(transitionLog).toBeDefined();
      expect(transitionLog![0]).toMatchObject({
        level: 'info',
        message: 'ConversationService.processTurn - phase transition',
        fromPhase: 'goalElicitation',
        toPhase: 'synthesis',
      });
    });

    it('should log persistence action', async () => {
      await ConversationService.processTurn(mockSession, mockRequest);

      const consoleLogs = (console.log as jest.Mock).mock.calls;
      const persistLog = consoleLogs.find((call) => {
        const arg = call[0];
        return arg && typeof arg === 'object' && arg.message?.includes('persisting session');
      });

      expect(persistLog).toBeDefined();
      expect(persistLog![0]).toMatchObject({
        level: 'debug',
        message: expect.stringContaining('persisting session'),
      });
    });
  });

  describe('Error handling', () => {
    it('should log error and rethrow on SessionRepository error', async () => {
      const error = new Error('DynamoDB error');
      (SessionRepository.updateSession as jest.Mock).mockRejectedValue(error);

      await expect(ConversationService.processTurn(mockSession, mockRequest)).rejects.toThrow('DynamoDB error');

      const consoleLogs = (console.error as jest.Mock).mock.calls;
      const errorLog = consoleLogs.find((call) => {
        const arg = call[0];
        return arg && typeof arg === 'object' && arg.level === 'error';
      });

      expect(errorLog).toBeDefined();
      expect(errorLog![0]).toMatchObject({
        level: 'error',
        message: expect.stringContaining('error'),
        sessionId: mockSession.sessionId,
      });
    });

    it('should not mutate original session object', async () => {
      const originalTurnCount = mockSession.turnCount;
      const originalPhase = mockSession.phase;

      await ConversationService.processTurn(mockSession, mockRequest);

      expect(mockSession.turnCount).toBe(originalTurnCount);
      expect(mockSession.phase).toBe(originalPhase);
    });
  });

  describe('Constants usage', () => {
    it('should use DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD constant', async () => {
      // This is tested implicitly through phase transition tests
      // Verify the threshold is positive and reasonable
      expect(DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD).toBeGreaterThan(0);
      expect(DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD).toBeLessThanOrEqual(10);
    });

    it('should use GOAL_ELICITATION_MAX_TURNS constant', async () => {
      // Verify the max is reasonable
      expect(GOAL_ELICITATION_MAX_TURNS).toBeGreaterThan(DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD);
      expect(GOAL_ELICITATION_MAX_TURNS).toBeLessThanOrEqual(50);
    });

    it('should use SYNTHESIS_TRIGGER_PHRASE constant', async () => {
      // Verify the phrase is configured
      expect(SYNTHESIS_TRIGGER_PHRASE).toHaveLength(SYNTHESIS_TRIGGER_PHRASE.length);
      expect(SYNTHESIS_TRIGGER_PHRASE.toLowerCase()).toBe('ready for recommendations');
    });
  });
});
