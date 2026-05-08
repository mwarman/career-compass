import { z } from 'zod';

/**
 * Conversation phase enumeration for the conversation state machine.
 * Tracks the progression through discovery, goal elicitation, and synthesis phases.
 */
export const ConversationPhaseSchema = z.enum(['discovery', 'goalElicitation', 'synthesis'], {
  message: 'Phase must be one of: discovery, goalElicitation, synthesis',
});

/**
 * Type representing the conversation phase from the schema.
 */
export type ConversationPhase = z.infer<typeof ConversationPhaseSchema>;

/**
 * Bedrock Converse API message structure.
 * Represents a single turn in the multi-turn conversation history.
 */
export const BedrockMessageSchema = z.object({
  role: z.enum(['user', 'assistant']).describe('Message role: user or assistant'),
  content: z
    .array(z.object({}).passthrough())
    .describe('Content blocks: text, image, or other content types from Bedrock Converse API'),
});

/**
 * Type representing a Bedrock message from the schema.
 */
export type BedrockMessage = z.infer<typeof BedrockMessageSchema>;

/**
 * Session state schema representing the full state of a conversation session.
 * Stored in DynamoDB with sessionId as the partition key.
 */
export const SessionStateSchema = z.object({
  sessionId: z
    .string()
    .min(1, 'Session ID must not be empty')
    .describe('Partition key: unique identifier for the conversation session'),
  phase: ConversationPhaseSchema.describe('Current phase of the conversation state machine'),
  turnCount: z
    .number()
    .int()
    .min(0, 'Turn count must be non-negative')
    .describe('Sequential turn number in the conversation'),
  history: z
    .array(BedrockMessageSchema)
    .describe('Full Bedrock Converse API message history for multi-turn state management'),
  createdAt: z
    .number()
    .int()
    .min(0, 'Created timestamp must be non-negative')
    .describe('Epoch milliseconds when the session was created'),
  ttl: z
    .number()
    .int()
    .min(0, 'TTL must be non-negative')
    .describe('Epoch seconds for DynamoDB TTL (24 hours from last update)'),
});

/**
 * Type representing the complete session state.
 */
export type SessionState = z.infer<typeof SessionStateSchema>;
