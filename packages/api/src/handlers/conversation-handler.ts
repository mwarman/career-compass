/**
 * Lambda handler for POST /conversation/turn
 * Entry point for conversation API requests.
 * Implements request validation, routing, session management, and error handling.
 */

import { TurnRequestSchema, TurnRequest, SessionState } from '@career-compass/shared';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

import { SessionNotFoundError } from '../errors/session-not-found-error';
import { ValidationError } from '../errors/validation-error';
import { RepositoryError } from '../repositories/repository-error';
import { SessionRepository } from '../repositories/session-repository';
import { ConversationService } from '../services/conversation-service';
import { ok, created, errorResponse, badRequest } from '../utils/apigateway-response';
import { Logger } from '../utils/logger';

interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Lambda handler for POST /conversation/turn
 */
export const handler = async (event: APIGatewayProxyEventV2): Promise<LambdaResponse> => {
  const startTime = Date.now();
  const requestId = event.requestContext?.requestId || 'unknown';

  Logger.info('conversationHandler - entering', {
    requestId,
    method: event.requestContext?.http?.method,
    path: event.requestContext?.http?.path,
  });

  try {
    // Parse request body
    let body: unknown;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseError) {
      Logger.warn('conversationHandler - failed to parse body', {
        requestId,
        error: parseError,
      });
      return badRequest('Invalid JSON in request body');
    }

    // Validate request body with TurnRequestSchema
    Logger.debug('conversationHandler - validating request', {
      requestId,
      hasSessionId: body && typeof body === 'object' && 'sessionId' in body,
    });

    const validationResult = TurnRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      Logger.warn('conversationHandler - validation failed', {
        requestId,
        errorCount: validationErrors.length,
      });

      const validationError = new ValidationError('Request validation failed', validationErrors);
      return errorResponse(validationError);
    }

    const request: TurnRequest = validationResult.data;
    let session: SessionState;

    // Route based on sessionId presence
    if (!request.sessionId) {
      // First turn: create new session
      Logger.info('conversationHandler - first turn detected, creating session', {
        requestId,
      });

      try {
        session = await SessionRepository.createSession({
          phase: 'discovery',
          turnCount: 0,
          history: [],
        });

        Logger.debug('conversationHandler - session created', {
          requestId,
          sessionId: session.sessionId,
        });
      } catch (createError) {
        Logger.error('conversationHandler - failed to create session', {
          requestId,
          error: createError,
        });

        if (createError instanceof RepositoryError) {
          return errorResponse(createError);
        }
        throw createError;
      }
    } else {
      // Subsequent turn: load session from DynamoDB
      Logger.info('conversationHandler - subsequent turn detected, loading session', {
        requestId,
        sessionId: request.sessionId,
      });

      try {
        const loadedSession = await SessionRepository.getSession(request.sessionId);

        if (!loadedSession) {
          Logger.warn('conversationHandler - session not found', {
            requestId,
            sessionId: request.sessionId,
          });

          const sessionNotFoundError = new SessionNotFoundError(request.sessionId);
          return errorResponse(sessionNotFoundError);
        }

        session = loadedSession;

        Logger.debug('conversationHandler - session loaded', {
          requestId,
          sessionId: session.sessionId,
          phase: session.phase,
        });
      } catch (loadError) {
        Logger.error('conversationHandler - failed to load session', {
          requestId,
          sessionId: request.sessionId,
          error: loadError,
        });

        if (loadError instanceof RepositoryError) {
          return errorResponse(loadError);
        }
        throw loadError;
      }
    }

    // Delegate to ConversationService
    Logger.debug('conversationHandler - delegating to ConversationService', {
      requestId,
      sessionId: session.sessionId,
    });

    let response;
    try {
      response = await ConversationService.processTurn(session, request);

      Logger.debug('conversationHandler - ConversationService returned', {
        requestId,
        sessionId: session.sessionId,
        responseType: response.type,
      });
    } catch (serviceError) {
      Logger.error('conversationHandler - ConversationService error', {
        requestId,
        sessionId: session.sessionId,
        error: serviceError,
      });

      if (
        serviceError instanceof ValidationError ||
        serviceError instanceof SessionNotFoundError ||
        serviceError instanceof RepositoryError
      ) {
        return errorResponse(serviceError);
      }
      throw serviceError;
    }

    // Determine status code: 201 for first turn, 200 for subsequent
    const statusCode = !request.sessionId ? 201 : 200;
    const durationMs = Date.now() - startTime;

    Logger.info('conversationHandler - exiting', {
      requestId,
      sessionId: session.sessionId,
      statusCode,
      durationMs,
      turnCount: session.turnCount + 1,
    });

    return statusCode === 201 ? created(response) : ok(response);
  } catch (error) {
    const durationMs = Date.now() - startTime;

    Logger.error('conversationHandler - unhandled error', {
      requestId,
      durationMs,
      error,
    });

    // Return generic error response without leaking internal details
    const genericError = new RepositoryError('Internal server error', 'unhandled');
    return errorResponse(genericError);
  }
};
