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
