/**
 * Constants for conversation flow and synthesis triggers.
 * Aligned with backend constants to ensure consistency across the platform.
 */

/**
 * Minimum turn count before the synthesis trigger button becomes available.
 * Matches backend DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD to ensure
 * sufficient context is gathered before offering synthesis recommendations.
 */
export const MIN_TURNS_FOR_SYNTHESIS = 3;

/**
 * Maximum turn count for the conversation.
 * After 10 turns, the conversation automatically transitions to synthesis
 * if not already triggered manually.
 * Matches backend GOAL_ELICITATION_MAX_TURNS.
 */
export const MAX_CONVERSATION_TURNS = 10;

/**
 * Synthesis trigger phrase that users can submit to explicitly request recommendations.
 * Case-insensitive matching on backend; frontend submits exact phrase.
 * Matches backend SYNTHESIS_TRIGGER_PHRASE.
 */
export const SYNTHESIS_TRIGGER_PHRASE = 'ready for recommendations';
