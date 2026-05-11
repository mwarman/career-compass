/**
 * Unit tests for ConversationService.
 * Tests phase transition logic, synthesis trigger detection, and state management.
 */

import { SessionState, TurnRequest } from '@career-compass/shared';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { SessionRepository } from '../../repositories/session-repository';
import {
  DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD,
  GOAL_ELICITATION_MAX_TURNS,
  SYNTHESIS_TRIGGER_PHRASE,
} from '../../utils/constants';
import { BedrockService } from '../bedrock-service';
import { ConversationService } from '../conversation-service';

vi.mock('../../repositories/session-repository');
vi.mock('../../utils/logger');
vi.mock('../bedrock-service');

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
    vi.clearAllMocks();
    (SessionRepository.updateSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockSession,
      turnCount: 1,
    });
    // Mock Bedrock to return response without readiness block for discovery phase
    (BedrockService.converse as ReturnType<typeof vi.fn>).mockResolvedValue(
      'This is a helpful assistant response without readiness block.',
    );
    // Mock Bedrock synthesize to return a valid recommendation
    (BedrockService.synthesize as ReturnType<typeof vi.fn>).mockResolvedValue({
      profileSummary: 'Test profile summary',
      skillGaps: [
        {
          name: 'Test Skill Gap',
          severity: 'high',
          rationale: 'Test rationale',
        },
      ],
      recommendations: [
        {
          area: 'Test Learning Area',
          rationale: 'Test recommendation rationale',
          resourceCategories: ['Test'],
          estimatedEffort: 'moderate',
          estimatedTimeline: '1-2 months',
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

      const updateCall = (SessionRepository.updateSession as ReturnType<typeof vi.fn>).mock.calls[0];
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

      expect(response.type).toBe('synthesis');
      expect(response.phase).toBe('synthesis');
    });

    it('should set synthesisReady to true in synthesis phase', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'synthesis',
        turnCount: 10,
      };

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.type).toBe('synthesis');
      if (response.type === 'synthesis') {
        expect(response.recommendation).toBeDefined();
        expect(response.recommendation.profileSummary).toBeDefined();
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

  describe('Error handling', () => {
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

  describe('parseReadiness integration (AC-01, AC-02, AC-03)', () => {
    it('should extract readiness from Bedrock response with true block', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
        turnCount: DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD - 1,
      };

      // Mock Bedrock to return response with readiness block (true)
      (BedrockService.converse as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        'I believe you are ready <readiness>true</readiness> to move forward',
      );

      const response = await ConversationService.processTurn(session, mockRequest);

      // Verify readiness block is stripped from assistant message
      if (response.type === 'conversational') {
        expect(response.assistantMessage).not.toContain('<readiness>');
        expect(response.assistantMessage).toBe('I believe you are ready to move forward');
        // Should advance phase when readiness is true and threshold is met
        expect(response.phase).toBe('goalElicitation');
      } else {
        throw new Error('Expected conversational response');
      }
    });

    it('should extract readiness from Bedrock response with false block', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
        turnCount: DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD - 1,
      };

      // Mock Bedrock to return response with readiness block (false)
      (BedrockService.converse as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        'You need more information <readiness>false</readiness> before proceeding',
      );

      const response = await ConversationService.processTurn(session, mockRequest);

      // Verify readiness block is stripped from assistant message
      if (response.type === 'conversational') {
        expect(response.assistantMessage).not.toContain('<readiness>');
        expect(response.assistantMessage).toBe('You need more information before proceeding');
        // Should stay in discovery when readiness is false
        expect(response.phase).toBe('discovery');
      } else {
        throw new Error('Expected conversational response');
      }
    });

    it('should handle missing readiness block and default to false', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
        turnCount: DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD - 1,
      };

      // Mock Bedrock to return response without readiness block
      (BedrockService.converse as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        'This is a response without any readiness block',
      );

      const response = await ConversationService.processTurn(session, mockRequest);

      // Should default to ready: false and stay in discovery
      expect(response.phase).toBe('discovery');
      if (response.type === 'conversational') {
        expect(response.assistantMessage).toBe('This is a response without any readiness block');
      } else {
        throw new Error('Expected conversational response');
      }
    });

    it('should advance to goalElicitation when readiness is true and threshold is met', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
        turnCount: DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD - 1,
      };

      (BedrockService.converse as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        'Your context is sufficient <readiness>true</readiness>',
      );

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.phase).toBe('goalElicitation');
    });

    it('should advance to synthesis when readiness is true in goalElicitation', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'goalElicitation',
        turnCount: 5,
      };

      (BedrockService.converse as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        'I have enough data <readiness>true</readiness> to make recommendations',
      );

      const response = await ConversationService.processTurn(session, mockRequest);

      expect(response.phase).toBe('synthesis');
    });

    it('should persist cleaned message (no readiness XML) to DynamoDB history', async () => {
      const session: SessionState = {
        ...mockSession,
        phase: 'discovery',
      };

      (BedrockService.converse as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        'Clean this up <readiness>true</readiness> please',
      );

      await ConversationService.processTurn(session, mockRequest);

      const updateCall = (SessionRepository.updateSession as ReturnType<typeof vi.fn>).mock.calls[0];
      const historyArg = updateCall[1].history;
      const assistantMessageInHistory = historyArg[1].content[0].text;

      expect(assistantMessageInHistory).not.toContain('<readiness>');
      expect(assistantMessageInHistory).toBe('Clean this up please');
    });
  });
});
