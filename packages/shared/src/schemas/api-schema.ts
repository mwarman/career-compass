import { z } from 'zod';

import { RecommendationSchema } from './recommendation-schema';
import { ConversationPhaseSchema } from './session-schema';

/**
 * Schema for a conversation API turn request.
 * The sessionId is absent on the first turn and included on subsequent turns.
 */
export const TurnRequestSchema = z.object({
  sessionId: z
    .string()
    .min(1, 'Session ID must not be empty')
    .describe('Unique identifier for the conversation session (omitted on first turn)')
    .optional(),
  userMessage: z
    .string()
    .min(1, 'User message must not be empty')
    .max(5000, 'User message must not exceed 5000 characters')
    .describe('User input for this conversation turn'),
});

/**
 * Schema for a conversational turn response (discovery, goal elicitation, or pre-synthesis).
 * Includes assistant message and tracks conversation phase and readiness for synthesis.
 */
export const ConversationalResponseSchema = z.object({
  type: z.literal('conversational').describe('Response type indicator for discriminated unions'),
  sessionId: z
    .string()
    .min(1, 'Session ID must not be empty')
    .describe('Unique identifier for the conversation session'),
  assistantMessage: z
    .string()
    .min(1, 'Assistant message must not be empty')
    .describe('Assistant response for this conversation turn'),
  phase: ConversationPhaseSchema.describe('Current phase of the conversation state machine'),
  turnCount: z
    .number()
    .int()
    .min(1, 'Turn count must be at least 1')
    .describe('Sequential turn number in the conversation'),
  synthesisReady: z
    .boolean()
    .describe('Whether the system has gathered sufficient information to generate recommendations'),
});

/**
 * Schema for a synthesis response that includes the final recommendation.
 * Returned when the conversation reaches the synthesis phase and recommendations are generated.
 */
export const SynthesisResponseSchema = z.object({
  type: z.literal('synthesis').describe('Response type indicator for discriminated unions'),
  sessionId: z
    .string()
    .min(1, 'Session ID must not be empty')
    .describe('Unique identifier for the conversation session'),
  phase: ConversationPhaseSchema.refine((p) => p === 'synthesis', {
    message: 'Synthesis response phase must be synthesis',
  }).describe('Confirmation that this is the synthesis phase response'),
  turnCount: z
    .number()
    .int()
    .min(1, 'Turn count must be at least 1')
    .describe('Sequential turn number in the conversation'),
  recommendation: RecommendationSchema.describe('Structured recommendation output with skill gaps and learning areas'),
});

/**
 * Discriminated union schema covering both conversational and synthesis response types.
 * Use the `type` field to distinguish between response shapes in client code.
 */
export const TurnResponseSchema = z.discriminatedUnion('type', [ConversationalResponseSchema, SynthesisResponseSchema]);

/**
 * Inferred TypeScript type for turn request body.
 */
export type TurnRequest = z.infer<typeof TurnRequestSchema>;

/**
 * Inferred TypeScript type for conversational turn responses.
 */
export type ConversationalResponse = z.infer<typeof ConversationalResponseSchema>;

/**
 * Inferred TypeScript type for synthesis turn responses.
 */
export type SynthesisResponse = z.infer<typeof SynthesisResponseSchema>;

/**
 * Inferred TypeScript type for API turn responses (union of both response types).
 */
export type TurnResponse = z.infer<typeof TurnResponseSchema>;
