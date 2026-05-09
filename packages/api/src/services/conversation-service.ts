/**
 * Conversation service for processing multi-turn conversation logic.
 * Orchestrates conversation turns with phase management, state persistence,
 * and Bedrock integration for AI-powered recommendations.
 */

import {
  TurnRequest,
  TurnResponse,
  SessionState,
  ConversationalResponse,
  ConversationPhase,
} from '@career-compass/shared';

import { SessionRepository } from '../repositories/session-repository';
import {
  DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD,
  GOAL_ELICITATION_MAX_TURNS,
  SYNTHESIS_TRIGGER_PHRASE,
} from '../utils/constants';

/**
 * Detect if a user message contains the synthesis trigger phrase (case-insensitive).
 * @param message - The user message to check
 * @returns true if the trigger phrase is found in the message
 */
const detectSynthesisTrigger = (message: string): boolean => {
  return message.toLowerCase().includes(SYNTHESIS_TRIGGER_PHRASE.toLowerCase());
};

/**
 * Determine the next phase based on current phase, turn count, and Bedrock evaluation.
 * Implements the phase transition state machine:
 * - discovery → goalElicitation: when turnCount >= threshold AND skill context sufficient (stub: false)
 * - goalElicitation → synthesis: trigger phrase OR turnCount >= max OR Bedrock ready (stub: false)
 * - Any phase → synthesis: when trigger phrase detected
 *
 * @param currentPhase - The current conversation phase
 * @param nextTurnCount - The turn count after incrementing
 * @param userMessage - The current user message to check for trigger phrase
 * @param bedrockReadyStub - Stub Bedrock self-evaluation result (always false in M4)
 * @returns The phase to transition to
 */
const determineNextPhase = (
  currentPhase: ConversationPhase,
  nextTurnCount: number,
  userMessage: string,
  bedrockReadyStub: boolean,
): ConversationPhase => {
  // Any phase → synthesis: trigger phrase detected
  if (detectSynthesisTrigger(userMessage)) {
    return 'synthesis';
  }

  // If already in synthesis, stay in synthesis
  if (currentPhase === 'synthesis') {
    return 'synthesis';
  }

  // discovery → goalElicitation: turn count threshold AND skill context sufficient
  if (currentPhase === 'discovery') {
    if (nextTurnCount >= DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD && bedrockReadyStub) {
      return 'goalElicitation';
    }
    return 'discovery';
  }

  // goalElicitation → synthesis: turn count max OR Bedrock ready
  if (currentPhase === 'goalElicitation') {
    if (nextTurnCount >= GOAL_ELICITATION_MAX_TURNS || bedrockReadyStub) {
      return 'synthesis';
    }
    return 'goalElicitation';
  }

  // Default: no phase change
  return currentPhase;
};

/**
 * Process a single turn in the conversation.
 * Loads session state, determines phase, generates response (Bedrock stub in M4),
 * evaluates phase transitions, and persists updated state to DynamoDB.
 *
 * @param session - The current session state
 * @param request - The user message request
 * @returns The conversation turn response with updated session state
 */
const processTurn = async (session: SessionState, request: TurnRequest): Promise<TurnResponse> => {
  console.log({
    level: 'info',
    message: 'ConversationService.processTurn - entering',
    sessionId: session.sessionId,
    turnCount: session.turnCount,
    phase: session.phase,
  });

  try {
    // Increment turn count
    const nextTurnCount = session.turnCount + 1;

    // Log phase transition evaluation
    console.log({
      level: 'debug',
      message: 'ConversationService.processTurn - evaluating phase transition',
      sessionId: session.sessionId,
      currentPhase: session.phase,
      nextTurnCount,
      triggerPhraseDetected: detectSynthesisTrigger(request.userMessage),
    });

    // Determine next phase (stub Bedrock evaluation always returns false in M4)
    const bedrockReadyStub = false;
    const nextPhase = determineNextPhase(session.phase, nextTurnCount, request.userMessage, bedrockReadyStub);

    // Log phase transition if changed
    if (nextPhase !== session.phase) {
      console.log({
        level: 'info',
        message: 'ConversationService.processTurn - phase transition',
        sessionId: session.sessionId,
        fromPhase: session.phase,
        toPhase: nextPhase,
        turnCount: nextTurnCount,
      });
    }

    // Generate stub assistant response (Bedrock integration in M5)
    const assistantMessage = `[${nextPhase}] Processing your message: ${request.userMessage}`;

    // Create response payload
    const response: ConversationalResponse = {
      type: 'conversational',
      sessionId: session.sessionId,
      assistantMessage,
      phase: nextPhase,
      turnCount: nextTurnCount,
      synthesisReady: nextPhase === 'synthesis',
    };

    console.log({
      level: 'debug',
      message: 'ConversationService.processTurn - response generated',
      sessionId: session.sessionId,
      phase: response.phase,
      synthesisReady: response.synthesisReady,
    });

    // Persist updated session state to DynamoDB
    console.log({
      level: 'debug',
      message: 'ConversationService.processTurn - persisting session',
      sessionId: session.sessionId,
      phase: nextPhase,
      turnCount: nextTurnCount,
    });

    await SessionRepository.updateSession(session.sessionId, {
      phase: nextPhase,
      turnCount: nextTurnCount,
      history: [
        {
          role: 'user',
          content: [{ type: 'text', text: request.userMessage }],
        },
        {
          role: 'assistant',
          content: [{ type: 'text', text: assistantMessage }],
        },
      ],
    });

    console.log({
      level: 'info',
      message: 'ConversationService.processTurn - exiting',
      sessionId: session.sessionId,
      phase: nextPhase,
      turnCount: nextTurnCount,
    });

    return response;
  } catch (error) {
    console.error({
      level: 'error',
      message: 'ConversationService.processTurn - error',
      sessionId: session.sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const ConversationService = {
  processTurn,
};
