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
  SynthesisResponse,
  ConversationPhase,
} from '@career-compass/shared';

import { discoveryPrompt } from '../prompts/discovery-prompt';
import { goalElicitationPrompt } from '../prompts/goal-elicitation-prompt';
import { synthesisPrompt } from '../prompts/synthesis-prompt';
import { SessionRepository } from '../repositories/session-repository';
import {
  DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD,
  GOAL_ELICITATION_MAX_TURNS,
  SYNTHESIS_TRIGGER_PHRASE,
} from '../utils/constants';
import { Logger } from '../utils/logger';
import { parseReadiness } from '../utils/readiness';

import { BedrockService } from './bedrock-service';

/**
 * Get the system prompt for the current conversation phase.
 * @param phase - The current conversation phase
 * @returns The appropriate system prompt string for the phase
 */
const getSystemPrompt = (phase: ConversationPhase): string => {
  switch (phase) {
    case 'discovery':
      return discoveryPrompt;
    case 'goalElicitation':
      return goalElicitationPrompt;
    case 'synthesis':
      return synthesisPrompt;
    default: {
      // Exhaustive check; should never reach here with proper TypeScript
      const _exhaustive: never = phase;
      throw new Error(`Unknown conversation phase: ${_exhaustive}`);
    }
  }
};

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
 * - discovery → goalElicitation: when turnCount >= threshold AND skill context sufficient
 * - goalElicitation → synthesis: trigger phrase OR turnCount >= max OR Bedrock ready
 * - Any phase → synthesis: when trigger phrase detected
 *
 * @param currentPhase - The current conversation phase
 * @param nextTurnCount - The turn count after incrementing
 * @param userMessage - The current user message to check for trigger phrase
 * @param bedrockReady - Bedrock's readiness evaluation (from readiness block)
 * @returns The phase to transition to
 */
const determineNextPhase = (
  currentPhase: ConversationPhase,
  nextTurnCount: number,
  userMessage: string,
  bedrockReady: boolean,
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
    if (nextTurnCount >= DISCOVERY_TO_GOAL_ELICITATION_THRESHOLD && bedrockReady) {
      return 'goalElicitation';
    }
    return 'discovery';
  }

  // goalElicitation → synthesis: turn count max OR Bedrock ready
  if (currentPhase === 'goalElicitation') {
    if (nextTurnCount >= GOAL_ELICITATION_MAX_TURNS || bedrockReady) {
      return 'synthesis';
    }
    return 'goalElicitation';
  }

  // Default: no phase change
  return currentPhase;
};

/**
 * Process a single turn in the conversation.
 * Loads session state, calls Bedrock with phase-aware prompt, evaluates phase transitions,
 * and persists updated state to DynamoDB.
 *
 * For synthesis phase: calls BedrockService.synthesize() to generate structured recommendations.
 * For other phases: calls BedrockService.converse() for multi-turn dialogue.
 *
 * @param session - The current session state
 * @param request - The user message request
 * @returns The conversation turn response (ConversationalResponse or SynthesisResponse)
 */
const processTurn = async (session: SessionState, request: TurnRequest): Promise<TurnResponse> => {
  Logger.info('ConversationService.processTurn - entering', {
    sessionId: session.sessionId,
    turnCount: session.turnCount,
    phase: session.phase,
  });

  try {
    // Increment turn count
    const nextTurnCount = session.turnCount + 1;

    // Get the system prompt for the current phase
    const systemPrompt = getSystemPrompt(session.phase);

    // Append current user message to conversation history
    const conversationWithUserMessage = [
      ...session.history,
      {
        role: 'user' as const,
        content: [{ type: 'text', text: request.userMessage }],
      },
    ];

    // Handle synthesis phase with forced tool use to generate recommendations
    if (session.phase === 'synthesis') {
      Logger.info('ConversationService.processTurn - synthesis phase detected', {
        sessionId: session.sessionId,
        turnCount: nextTurnCount,
      });

      try {
        // Call Bedrock synthesize to generate structured recommendation
        const recommendation = await BedrockService.synthesize(systemPrompt, conversationWithUserMessage);

        Logger.debug('ConversationService.processTurn - recommendation generated', {
          sessionId: session.sessionId,
          skillGapsCount: recommendation.skillGaps.length,
          recommendationsCount: recommendation.recommendations.length,
        });

        // Create synthesis response
        const response: SynthesisResponse = {
          type: 'synthesis',
          sessionId: session.sessionId,
          phase: 'synthesis',
          turnCount: nextTurnCount,
          recommendation,
        };

        Logger.debug('ConversationService.processTurn - synthesis response created', {
          sessionId: session.sessionId,
          recommendationReady: !!recommendation,
        });

        // Persist updated session state to DynamoDB
        Logger.debug('ConversationService.processTurn - persisting session', {
          sessionId: session.sessionId,
          phase: 'synthesis',
          turnCount: nextTurnCount,
        });

        await SessionRepository.updateSession(session.sessionId, {
          phase: 'synthesis',
          turnCount: nextTurnCount,
          history: [
            {
              role: 'user',
              content: [{ type: 'text', text: request.userMessage }],
            },
            {
              role: 'assistant',
              content: [{ type: 'text', text: 'Recommendations generated using forced tool use.' }],
            },
          ],
        });

        Logger.info('ConversationService.processTurn - exiting with synthesis response', {
          sessionId: session.sessionId,
          phase: 'synthesis',
          turnCount: nextTurnCount,
        });

        return response;
      } catch (error) {
        Logger.error('ConversationService.processTurn - synthesis error', {
          sessionId: session.sessionId,
          error,
        });
        throw error;
      }
    }

    // Handle non-synthesis phases with conversational Bedrock API
    Logger.debug('ConversationService.processTurn - calling Bedrock converse', {
      sessionId: session.sessionId,
      phase: session.phase,
      messageCount: session.history.length,
    });

    // Call Bedrock with phase-aware prompt and conversation history
    const bedrockResponse = await BedrockService.converse(systemPrompt, conversationWithUserMessage);

    Logger.debug('ConversationService.processTurn - Bedrock response received', {
      sessionId: session.sessionId,
      responseLength: bedrockResponse.length,
    });

    // Parse readiness from the response and strip the block from the message
    const { cleanedMessage: assistantMessage, ready: bedrockReady } = parseReadiness(bedrockResponse);

    Logger.debug('ConversationService.processTurn - readiness evaluated', {
      sessionId: session.sessionId,
      phase: session.phase,
      bedrockReady,
    });

    // Log phase transition evaluation
    Logger.debug('ConversationService.processTurn - evaluating phase transition', {
      sessionId: session.sessionId,
      currentPhase: session.phase,
      nextTurnCount,
      triggerPhraseDetected: detectSynthesisTrigger(request.userMessage),
      bedrockReady,
    });

    // Determine next phase based on turn count, trigger phrase, and Bedrock readiness
    const nextPhase = determineNextPhase(session.phase, nextTurnCount, request.userMessage, bedrockReady);

    // Log phase transition if changed
    if (nextPhase !== session.phase) {
      Logger.info('ConversationService.processTurn - phase transition', {
        sessionId: session.sessionId,
        fromPhase: session.phase,
        toPhase: nextPhase,
        turnCount: nextTurnCount,
      });
    }

    // Create response payload
    const response: ConversationalResponse = {
      type: 'conversational',
      sessionId: session.sessionId,
      assistantMessage,
      phase: nextPhase,
      turnCount: nextTurnCount,
      synthesisReady: nextPhase === 'synthesis',
    };

    Logger.debug('ConversationService.processTurn - response created', {
      sessionId: session.sessionId,
      phase: response.phase,
      synthesisReady: response.synthesisReady,
      messageLength: assistantMessage.length,
    });

    // Persist updated session state to DynamoDB
    Logger.debug('ConversationService.processTurn - persisting session', {
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

    Logger.info('ConversationService.processTurn - exiting', {
      sessionId: session.sessionId,
      phase: nextPhase,
      turnCount: nextTurnCount,
    });

    return response;
  } catch (error) {
    Logger.error('ConversationService.processTurn - error', {
      sessionId: session.sessionId,
      error,
    });
    throw error;
  }
};

export const ConversationService = {
  processTurn,
};
