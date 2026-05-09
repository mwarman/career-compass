/**
 * Constants for conversation state management and phase transitions.
 * Configurable thresholds for conversation flow and synthesis readiness.
 */

/**
 * Turn count threshold for transitioning from discovery to goal elicitation phase.
 * Once a user has provided sufficient context across multiple turns, the system
 * can begin focused goal elicitation.
 */
export const DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD = 3;

/**
 * Maximum turn count for goal elicitation phase.
 * If the user hasn't provided the synthesis trigger phrase by this turn,
 * the system automatically transitions to synthesis to generate recommendations.
 */
export const GOAL_ELICITATION_MAX_TURNS = 10;

/**
 * Synthesis trigger phrase (case-insensitive).
 * When the user message contains this phrase, the system immediately transitions
 * to synthesis phase and generates recommendations.
 */
export const SYNTHESIS_TRIGGER_PHRASE = 'ready for recommendations';

/**
 * Bedrock model configuration constants.
 * These define the AI model being used for conversation and recommendation generation.
 */
export const BEDROCK_MODEL_CONFIG = {
  /**
   * Default model ID if not specified in environment variables.
   * Typically 'anthropic.claude-haiku-4-5-20251001-v1:0' or later versions.
   */
  defaultModelId: 'anthropic.claude-haiku-4-5-20251001-v1:0',

  /**
   * Default region for Bedrock API calls.
   * Should match where the Bedrock service is available.
   */
  defaultRegion: 'us-east-1',

  /**
   * Maximum number of messages to include in Bedrock Converse API calls.
   * Helps control token usage and API costs.
   */
  maxMessageHistory: 50,

  /**
   * Temperature for Bedrock API calls (0.0 to 1.0).
   * Lower values make output more deterministic; higher values increase creativity.
   */
  temperature: 0.7,

  /**
   * Maximum tokens to generate per response.
   * Prevents excessively long outputs and controls costs.
   */
  maxTokens: 1024,
};
