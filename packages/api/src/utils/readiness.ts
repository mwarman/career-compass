/**
 * Utility for parsing and extracting the readiness block from Bedrock responses.
 * The readiness block indicates whether the system believes it has sufficient context
 * to advance to the next phase in the conversation state machine.
 */

/**
 * Parse readiness block from a Bedrock response and strip it from the message.
 *
 * Looks for a <readiness>true|false</readiness> XML block in the response.
 * If found, extracts the boolean value and removes the block from the message.
 * If not found, defensively defaults to false.
 *
 * @param rawResponse - The raw assistant message from Bedrock, potentially containing a readiness block
 * @returns Object with cleanedMessage (block stripped) and ready boolean value
 */
export const parseReadiness = (rawResponse: string): { cleanedMessage: string; ready: boolean } => {
  const readinessRegex = /<readiness>(true|false)<\/readiness>/;
  const match = rawResponse.match(readinessRegex);

  // Extract readiness value if block exists, default to false if not present
  const ready = match && match[1] === 'true' ? true : false;

  // Strip the readiness block from the message and normalize spaces
  const cleanedMessage = rawResponse
    .replace(/<readiness>(true|false)<\/readiness>/g, ' ') // Replace with space
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim(); // Remove leading/trailing whitespace

  return { cleanedMessage, ready };
};
