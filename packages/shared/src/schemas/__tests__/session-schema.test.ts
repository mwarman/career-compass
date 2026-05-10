import { describe, it, expect } from 'vitest';

import {
  ConversationPhaseSchema,
  BedrockMessageSchema,
  SessionStateSchema,
  type BedrockMessage,
  type SessionState,
} from '../session-schema';

describe('ConversationPhaseSchema', () => {
  describe('valid phases', () => {
    it('should validate "discovery" phase', () => {
      const result = ConversationPhaseSchema.safeParse('discovery');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('discovery');
      }
    });

    it('should validate "goalElicitation" phase', () => {
      const result = ConversationPhaseSchema.safeParse('goalElicitation');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('goalElicitation');
      }
    });

    it('should validate "synthesis" phase', () => {
      const result = ConversationPhaseSchema.safeParse('synthesis');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('synthesis');
      }
    });
  });

  describe('invalid phases', () => {
    it('should fail with invalid phase value', () => {
      const result = ConversationPhaseSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('should fail with undefined', () => {
      const result = ConversationPhaseSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should fail with null', () => {
      const result = ConversationPhaseSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});

describe('BedrockMessageSchema', () => {
  describe('valid messages', () => {
    it('should validate a user message with text content', () => {
      const message: BedrockMessage = {
        role: 'user',
        content: [{ type: 'text', text: 'Hello, what skills should I learn?' }],
      };
      const result = BedrockMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });

    it('should validate an assistant message with text content', () => {
      const message: BedrockMessage = {
        role: 'assistant',
        content: [{ type: 'text', text: 'I would recommend focusing on...' }],
      };
      const result = BedrockMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });

    it('should validate a message with multiple content blocks', () => {
      const message: BedrockMessage = {
        role: 'user',
        content: [
          { type: 'text', text: 'Check this image' },
          { type: 'image', source: { type: 'base64', mediaType: 'image/png', data: 'abc123' } },
        ],
      };
      const result = BedrockMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });

    it('should validate a message with empty content array', () => {
      const message: BedrockMessage = {
        role: 'user',
        content: [],
      };
      const result = BedrockMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid messages', () => {
    it('should fail when role is missing', () => {
      const message = {
        content: [{ type: 'text', text: 'Hello' }],
      };
      const result = BedrockMessageSchema.safeParse(message);
      expect(result.success).toBe(false);
    });

    it('should fail when role is invalid', () => {
      const message = {
        role: 'moderator',
        content: [{ type: 'text', text: 'Hello' }],
      };
      const result = BedrockMessageSchema.safeParse(message);
      expect(result.success).toBe(false);
    });

    it('should fail when content is missing', () => {
      const message = {
        role: 'user',
      };
      const result = BedrockMessageSchema.safeParse(message);
      expect(result.success).toBe(false);
    });

    it('should fail when content is not an array', () => {
      const message = {
        role: 'user',
        content: 'not an array',
      };
      const result = BedrockMessageSchema.safeParse(message);
      expect(result.success).toBe(false);
    });
  });
});

describe('SessionStateSchema', () => {
  const validSessionState: SessionState = {
    sessionId: 'session-123',
    phase: 'discovery',
    turnCount: 1,
    history: [
      {
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      },
    ],
    createdAt: 1715000000000,
    ttl: Math.floor(Date.now() / 1000) + 86400,
  };

  describe('valid session state', () => {
    it('should validate a complete session state', () => {
      const result = SessionStateSchema.safeParse(validSessionState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validSessionState);
      }
    });

    it('should validate a session in goalElicitation phase', () => {
      const state = { ...validSessionState, phase: 'goalElicitation' as const, turnCount: 3 };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should validate a session in synthesis phase', () => {
      const state = { ...validSessionState, phase: 'synthesis' as const, turnCount: 5 };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should validate a session with multiple messages in history', () => {
      const state = {
        ...validSessionState,
        history: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
          {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hi there' }],
          },
          {
            role: 'user',
            content: [{ type: 'text', text: 'What now?' }],
          },
        ],
      };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should validate a session with empty history', () => {
      const state = { ...validSessionState, history: [] };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should validate a session with turnCount zero', () => {
      const state = { ...validSessionState, turnCount: 0 };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should fail when sessionId is missing', () => {
      const { sessionId: _sessionId, ...state } = validSessionState;
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('sessionId'))).toBe(true);
      }
    });

    it('should fail when sessionId is empty string', () => {
      const state = { ...validSessionState, sessionId: '' };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when phase is missing', () => {
      const { phase: _phase, ...state } = validSessionState;
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when phase is invalid', () => {
      const state = { ...validSessionState, phase: 'invalid' };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when turnCount is missing', () => {
      const { turnCount: _turnCount, ...state } = validSessionState;
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when turnCount is negative', () => {
      const state = { ...validSessionState, turnCount: -1 };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when history is missing', () => {
      const { history: _history, ...state } = validSessionState;
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when createdAt is missing', () => {
      const { createdAt: _createdAt, ...state } = validSessionState;
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when createdAt is negative', () => {
      const state = { ...validSessionState, createdAt: -1000 };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when ttl is missing', () => {
      const { ttl: _ttl, ...state } = validSessionState;
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when ttl is negative', () => {
      const state = { ...validSessionState, ttl: -1000 };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });
  });

  describe('type validation', () => {
    it('should fail when turnCount is a float', () => {
      const state = { ...validSessionState, turnCount: 1.5 };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when createdAt is a float', () => {
      const state = { ...validSessionState, createdAt: 1715000000000.5 };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when ttl is a float', () => {
      const state = { ...validSessionState, ttl: 1715086400.5 };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('should fail when history is not an array', () => {
      const state = { ...validSessionState, history: 'not an array' };
      const result = SessionStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });
  });
});
