import { describe, it, expect } from '@jest/globals';

import {
  TurnRequestSchema,
  ConversationalResponseSchema,
  SynthesisResponseSchema,
  TurnResponseSchema,
  type ConversationalResponse,
  type SynthesisResponse,
  type TurnResponse,
} from '../api-schema';
import type { Recommendation } from '../recommendation-schema';

describe('TurnRequestSchema', () => {
  describe('valid inputs', () => {
    it('should validate a request with sessionId and userMessage', () => {
      const validRequest = {
        sessionId: 'session-123',
        userMessage: 'What skills should I learn?',
      };
      const result = TurnRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRequest);
      }
    });

    it('should validate a request without sessionId (first turn)', () => {
      const validRequest = {
        userMessage: 'Hello, I want to explore my career options',
      };
      const result = TurnRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBeUndefined();
      }
    });

    it('should validate a request with a long user message', () => {
      const validRequest = {
        sessionId: 'session-456',
        userMessage: 'a'.repeat(5000),
      };
      const result = TurnRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should fail when userMessage is missing', () => {
      const invalid = {
        sessionId: 'session-123',
      };
      const result = TurnRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('userMessage'))).toBe(true);
      }
    });

    it('should fail when sessionId is empty string', () => {
      const invalid = {
        sessionId: '',
        userMessage: 'Hello',
      };
      const result = TurnRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('sessionId'))).toBe(true);
      }
    });

    it('should fail when userMessage is empty string', () => {
      const invalid = {
        sessionId: 'session-123',
        userMessage: '',
      };
      const result = TurnRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('userMessage'))).toBe(true);
      }
    });
  });

  describe('constraints', () => {
    it('should fail when userMessage exceeds 5000 characters', () => {
      const invalid = {
        sessionId: 'session-123',
        userMessage: 'a'.repeat(5001),
      };
      const result = TurnRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when userMessage is not a string', () => {
      const invalid = {
        sessionId: 'session-123',
        userMessage: 12345,
      };
      const result = TurnRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when sessionId is not a string', () => {
      const invalid = {
        sessionId: 12345,
        userMessage: 'Hello',
      };
      const result = TurnRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

describe('ConversationalResponseSchema', () => {
  const validConversationalResponse: ConversationalResponse = {
    type: 'conversational',
    sessionId: 'session-123',
    assistantMessage: 'That is a great question. Let me help you explore your career options.',
    phase: 'discovery',
    turnCount: 1,
    synthesisReady: false,
  };

  describe('valid inputs', () => {
    it('should validate a complete conversational response', () => {
      const result = ConversationalResponseSchema.safeParse(validConversationalResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validConversationalResponse);
      }
    });

    it('should validate response in goalElicitation phase', () => {
      const validResponse: ConversationalResponse = {
        ...validConversationalResponse,
        phase: 'goalElicitation',
        turnCount: 3,
      };
      const result = ConversationalResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate response in synthesis phase with synthesisReady true', () => {
      const validResponse: ConversationalResponse = {
        ...validConversationalResponse,
        phase: 'synthesis',
        turnCount: 5,
        synthesisReady: true,
      };
      const result = ConversationalResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate response with different turn counts', () => {
      const validResponse: ConversationalResponse = {
        ...validConversationalResponse,
        turnCount: 10,
      };
      const result = ConversationalResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should fail when type is missing', () => {
      const invalid = {
        sessionId: 'session-123',
        assistantMessage: 'Hello',
        phase: 'discovery',
        turnCount: 1,
        synthesisReady: false,
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when sessionId is missing', () => {
      const invalid = {
        type: 'conversational',
        assistantMessage: 'Hello',
        phase: 'discovery',
        turnCount: 1,
        synthesisReady: false,
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when assistantMessage is missing', () => {
      const invalid = {
        type: 'conversational',
        sessionId: 'session-123',
        phase: 'discovery',
        turnCount: 1,
        synthesisReady: false,
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when phase is missing', () => {
      const invalid = {
        type: 'conversational',
        sessionId: 'session-123',
        assistantMessage: 'Hello',
        turnCount: 1,
        synthesisReady: false,
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when turnCount is missing', () => {
      const invalid = {
        type: 'conversational',
        sessionId: 'session-123',
        assistantMessage: 'Hello',
        phase: 'discovery',
        synthesisReady: false,
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when synthesisReady is missing', () => {
      const invalid = {
        type: 'conversational',
        sessionId: 'session-123',
        assistantMessage: 'Hello',
        phase: 'discovery',
        turnCount: 1,
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('invalid enum values', () => {
    it('should fail when phase has invalid value', () => {
      const invalid = {
        ...validConversationalResponse,
        phase: 'invalid',
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('phase'))).toBe(true);
      }
    });

    it('should fail when type is not "conversational"', () => {
      const invalid = {
        ...validConversationalResponse,
        type: 'synthesis',
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('constraints', () => {
    it('should fail when assistantMessage is empty string', () => {
      const invalid = {
        ...validConversationalResponse,
        assistantMessage: '',
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when sessionId is empty string', () => {
      const invalid = {
        ...validConversationalResponse,
        sessionId: '',
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when turnCount is 0', () => {
      const invalid = {
        ...validConversationalResponse,
        turnCount: 0,
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when turnCount is negative', () => {
      const invalid = {
        ...validConversationalResponse,
        turnCount: -1,
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when turnCount is not an integer', () => {
      const invalid = {
        ...validConversationalResponse,
        turnCount: 1.5,
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when synthesisReady is not a boolean', () => {
      const invalid = {
        ...validConversationalResponse,
        synthesisReady: 'true',
      };
      const result = ConversationalResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

describe('SynthesisResponseSchema', () => {
  const validRecommendation: Recommendation = {
    profileSummary: 'Senior software engineer seeking to move into leadership',
    skillGaps: [
      {
        name: 'Team Management',
        severity: 'high',
        rationale: 'Essential for transitioning to engineering leadership',
      },
    ],
    recommendations: [
      {
        area: 'Engineering Leadership Program',
        rationale: 'Build management and communication skills',
        resourceCategories: ['Course', 'Mentorship'],
        estimatedEffort: 'substantial',
        estimatedTimeline: '12 weeks',
      },
    ],
  };

  const validSynthesisResponse: SynthesisResponse = {
    type: 'synthesis',
    sessionId: 'session-789',
    phase: 'synthesis',
    turnCount: 6,
    recommendation: validRecommendation,
  };

  describe('valid inputs', () => {
    it('should validate a complete synthesis response', () => {
      const result = SynthesisResponseSchema.safeParse(validSynthesisResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validSynthesisResponse);
      }
    });

    it('should validate response with different turn counts', () => {
      const validResponse: SynthesisResponse = {
        ...validSynthesisResponse,
        turnCount: 15,
      };
      const result = SynthesisResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should fail when type is missing', () => {
      const invalid = {
        sessionId: 'session-789',
        phase: 'synthesis',
        turnCount: 6,
        recommendation: validRecommendation,
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when sessionId is missing', () => {
      const invalid = {
        type: 'synthesis',
        phase: 'synthesis',
        turnCount: 6,
        recommendation: validRecommendation,
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when phase is missing', () => {
      const invalid = {
        type: 'synthesis',
        sessionId: 'session-789',
        turnCount: 6,
        recommendation: validRecommendation,
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when turnCount is missing', () => {
      const invalid = {
        type: 'synthesis',
        sessionId: 'session-789',
        phase: 'synthesis',
        recommendation: validRecommendation,
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when recommendation is missing', () => {
      const invalid = {
        type: 'synthesis',
        sessionId: 'session-789',
        phase: 'synthesis',
        turnCount: 6,
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('constraints', () => {
    it('should fail when sessionId is empty string', () => {
      const invalid = {
        ...validSynthesisResponse,
        sessionId: '',
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when phase is not "synthesis"', () => {
      const invalid = {
        ...validSynthesisResponse,
        phase: 'discovery',
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when turnCount is 0', () => {
      const invalid = {
        ...validSynthesisResponse,
        turnCount: 0,
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when type is not "synthesis"', () => {
      const invalid = {
        ...validSynthesisResponse,
        type: 'conversational',
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when recommendation has invalid structure', () => {
      const invalid = {
        ...validSynthesisResponse,
        recommendation: {
          profileSummary: '',
          skillGaps: [],
          recommendations: [],
        },
      };
      const result = SynthesisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

describe('TurnResponseSchema (Discriminated Union)', () => {
  const validConversationalResponse: ConversationalResponse = {
    type: 'conversational',
    sessionId: 'session-123',
    assistantMessage: 'Let me help you with that.',
    phase: 'discovery',
    turnCount: 1,
    synthesisReady: false,
  };

  const validRecommendation: Recommendation = {
    profileSummary: 'Senior engineer',
    skillGaps: [{ name: 'Leadership', severity: 'high', rationale: 'Important for growth' }],
    recommendations: [
      {
        area: 'Leadership Program',
        rationale: 'Build leadership skills',
        resourceCategories: ['Course'],
        estimatedEffort: 'substantial',
        estimatedTimeline: '12 weeks',
      },
    ],
  };

  const validSynthesisResponse: SynthesisResponse = {
    type: 'synthesis',
    sessionId: 'session-789',
    phase: 'synthesis',
    turnCount: 6,
    recommendation: validRecommendation,
  };

  describe('conversational response type', () => {
    it('should validate and parse conversational response', () => {
      const result = TurnResponseSchema.safeParse(validConversationalResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = result.data as TurnResponse;
        expect(parsed.type).toBe('conversational');
      }
    });

    it('should preserve type after parsing', () => {
      const result = TurnResponseSchema.safeParse(validConversationalResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        const response = result.data as ConversationalResponse;
        if (response.type === 'conversational') {
          expect(response.assistantMessage).toBeDefined();
          expect(response.synthesisReady).toBe(false);
        }
      }
    });
  });

  describe('synthesis response type', () => {
    it('should validate and parse synthesis response', () => {
      const result = TurnResponseSchema.safeParse(validSynthesisResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = result.data as TurnResponse;
        expect(parsed.type).toBe('synthesis');
      }
    });

    it('should preserve type after parsing', () => {
      const result = TurnResponseSchema.safeParse(validSynthesisResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        const response = result.data as SynthesisResponse;
        if (response.type === 'synthesis') {
          expect(response.recommendation).toBeDefined();
          expect(response.phase).toBe('synthesis');
        }
      }
    });
  });

  describe('discriminated union discrimination', () => {
    it('should accept conversational response even with extra unknown fields', () => {
      const response = {
        type: 'conversational',
        sessionId: 'session-123',
        assistantMessage: 'Hello',
        phase: 'discovery',
        turnCount: 1,
        synthesisReady: false,
        extraField: 'should be ignored',
      };
      const result = TurnResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should fail when response type does not match expected schema', () => {
      const invalid = {
        type: 'invalid',
        sessionId: 'session-123',
      };
      const result = TurnResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should correctly infer conversational type at compile time', () => {
      const response: TurnResponse = validConversationalResponse;
      expect(response.type).toBe('conversational');
      expect(response.sessionId).toBe('session-123');
    });

    it('should correctly infer synthesis type at compile time', () => {
      const response: TurnResponse = validSynthesisResponse;
      expect(response.type).toBe('synthesis');
      expect(response.sessionId).toBe('session-789');
    });
  });
});
