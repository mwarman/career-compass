// Export recommendation schema and types
export {
  RecommendationSchema,
  type Recommendation,
  type SkillGap,
  type RecommendedArea,
} from './schemas/recommendation-schema';

// Export API schemas and types
export {
  TurnRequestSchema,
  ConversationalResponseSchema,
  SynthesisResponseSchema,
  TurnResponseSchema,
  type TurnRequest,
  type ConversationalResponse,
  type SynthesisResponse,
  type TurnResponse,
} from './schemas/api-schema';

// Export session state schemas and types
export {
  ConversationPhaseSchema,
  BedrockMessageSchema,
  SessionStateSchema,
  type ConversationPhase,
  type BedrockMessage,
  type SessionState,
} from './schemas/session-schema';

// Export Bedrock tool schema utilities
export { getRecommendationToolSchema } from './utils/bedrock-tool-schema';
