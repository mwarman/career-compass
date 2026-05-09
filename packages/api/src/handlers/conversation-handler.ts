/**
 * Lambda handler for POST /conversation/turn
 * Entry point for conversation API requests.
 * Implements request validation, routing, session management, and error handling.
 */

import { TurnRequestSchema, TurnRequest, SessionState } from '@career-compass/shared';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { SessionRepository } from '../repositories/session-repository';
import { ConversationService } from '../services/conversation-service';
import { ok, created, badRequest, notFound, internalServerError } from '../utils/apigateway-response';

/**
 * Lambda handler for POST /conversation/turn
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const requestId = event.requestContext?.requestId || 'unknown';

  console.log({
    level: 'info',
    message: 'conversationHandler - entering',
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
      console.log({
        level: 'warn',
        message: 'conversationHandler - failed to parse body',
        requestId,
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return badRequest('Invalid JSON in request body');
    }

    // Validate request body with TurnRequestSchema
    console.log({
      level: 'debug',
      message: 'conversationHandler - validating request',
      requestId,
      hasSessionId: body && typeof body === 'object' && 'sessionId' in body,
    });

    const validationResult = TurnRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      console.log({
        level: 'warn',
        message: 'conversationHandler - validation failed',
        requestId,
        errors: validationErrors,
      });

      return badRequest('Request validation failed', validationErrors);
    }

    const request: TurnRequest = validationResult.data;
    let session: SessionState;

    // Route based on sessionId presence
    if (!request.sessionId) {
      // First turn: create new session
      console.log({
        level: 'info',
        message: 'conversationHandler - first turn detected, creating session',
        requestId,
      });

      try {
        session = await SessionRepository.createSession({
          phase: 'discovery',
          turnCount: 0,
          history: [],
        });

        console.log({
          level: 'debug',
          message: 'conversationHandler - session created',
          requestId,
          sessionId: session.sessionId,
        });
      } catch (createError) {
        console.error({
          level: 'error',
          message: 'conversationHandler - failed to create session',
          requestId,
          error: createError instanceof Error ? createError.message : String(createError),
        });
        return internalServerError();
      }
    } else {
      // Subsequent turn: load session from DynamoDB
      console.log({
        level: 'info',
        message: 'conversationHandler - subsequent turn detected, loading session',
        requestId,
        sessionId: request.sessionId,
      });

      try {
        const loadedSession = await SessionRepository.getSession(request.sessionId);

        if (!loadedSession) {
          console.log({
            level: 'warn',
            message: 'conversationHandler - session not found',
            requestId,
            sessionId: request.sessionId,
          });
          return notFound('Session not found');
        }

        session = loadedSession;

        console.log({
          level: 'debug',
          message: 'conversationHandler - session loaded',
          requestId,
          sessionId: session.sessionId,
          phase: session.phase,
        });
      } catch (loadError) {
        console.error({
          level: 'error',
          message: 'conversationHandler - failed to load session',
          requestId,
          sessionId: request.sessionId,
          error: loadError instanceof Error ? loadError.message : String(loadError),
        });
        return internalServerError();
      }
    }

    // Delegate to ConversationService
    console.log({
      level: 'info',
      message: 'conversationHandler - delegating to ConversationService',
      requestId,
      sessionId: session.sessionId,
    });

    let response;
    try {
      response = await ConversationService.processTurn(session, request);

      console.log({
        level: 'debug',
        message: 'conversationHandler - ConversationService returned',
        requestId,
        sessionId: session.sessionId,
        responseType: response.type,
      });
    } catch (serviceError) {
      console.error({
        level: 'error',
        message: 'conversationHandler - ConversationService error',
        requestId,
        sessionId: session.sessionId,
        error: serviceError instanceof Error ? serviceError.message : String(serviceError),
      });
      return internalServerError();
    }

    // Determine status code: 201 for first turn, 200 for subsequent
    const statusCode = !request.sessionId ? 201 : 200;

    console.log({
      level: 'info',
      message: 'conversationHandler - exiting',
      requestId,
      sessionId: session.sessionId,
      statusCode,
    });

    return statusCode === 201 ? created(response) : ok(response);
  } catch (error) {
    console.error({
      level: 'error',
      message: 'conversationHandler - unhandled error',
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return internalServerError();
  }
};
