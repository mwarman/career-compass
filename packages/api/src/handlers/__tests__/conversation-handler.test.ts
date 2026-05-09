/**
 * Unit tests for conversation handler.
 * Tests all acceptance criteria: validation, routing, session management, error handling.
 */

import { TurnResponse, SessionState } from '@career-compass/shared';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

// Mock external dependencies before importing the handler
jest.mock('../../repositories/session-repository');
jest.mock('../../services/conversation-service');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SessionRepository } = require('../../repositories/session-repository');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ConversationService } = require('../../services/conversation-service');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler } = require('../conversation-handler');

describe('conversationHandler', () => {
  const mockSessionState: SessionState = {
    sessionId: 'test-session-123',
    phase: 'discovery',
    turnCount: 0,
    history: [],
    createdAt: Date.now(),
    ttl: Math.floor(Date.now() / 1000) + 86400,
  };

  const mockTurnResponse: TurnResponse = {
    type: 'conversational',
    sessionId: 'test-session-123',
    assistantMessage: 'Test response',
    phase: 'discovery',
    turnCount: 1,
    synthesisReady: false,
  };

  const createMockEvent = (overrides?: Partial<APIGatewayProxyEventV2>): APIGatewayProxyEventV2 => {
    const now = Date.now();
    return {
      requestContext: {
        http: {
          method: 'POST',
          path: '/conversation/turn',
          protocol: 'HTTP/1.1',
          sourceIp: '127.0.0.1',
          userAgent: 'test',
        },
        requestId: 'test-request-123',
        domainName: 'localhost',
        domainPrefix: 'api',
        time: new Date(now).toISOString(),
        timeEpoch: now,
        routeKey: 'POST /conversation/turn',
        accountId: '123456789012',
        stage: '$default',
        apiId: 'test-api',
      },
      version: '2.0',
      ...overrides,
    } as APIGatewayProxyEventV2;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC-01: Request validation', () => {
    it('should return 400 with error details when body is invalid JSON', async () => {
      const event = createMockEvent({
        body: '{invalid json}',
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
    });

    it('should return 400 when userMessage is missing', async () => {
      const event = createMockEvent({
        body: JSON.stringify({ sessionId: 'test-123' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Request validation failed');
      expect(body.details).toBeDefined();
    });

    it('should return 400 when userMessage is empty string', async () => {
      const event = createMockEvent({
        body: JSON.stringify({ userMessage: '' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Request validation failed');
    });

    it('should return 400 when userMessage exceeds 5000 characters', async () => {
      const longMessage = 'a'.repeat(5001);
      const event = createMockEvent({
        body: JSON.stringify({ userMessage: longMessage }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Request validation failed');
    });

    it('should return 400 when sessionId is empty string', async () => {
      const event = createMockEvent({
        body: JSON.stringify({ sessionId: '', userMessage: 'test' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Request validation failed');
    });
  });

  describe('AC-02: Routing - First turn (no sessionId)', () => {
    it('should create a new session and return 201 when sessionId is absent', async () => {
      SessionRepository.createSession.mockResolvedValue(mockSessionState);
      ConversationService.processTurn.mockResolvedValue(mockTurnResponse);

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      expect(SessionRepository.createSession).toHaveBeenCalledWith({
        phase: 'discovery',
        turnCount: 0,
        history: [],
      });
      expect(ConversationService.processTurn).toHaveBeenCalledWith(
        mockSessionState,
        expect.objectContaining({ userMessage: 'Hello' }),
      );
    });

    it('should return created response with CORS headers on first turn', async () => {
      SessionRepository.createSession.mockResolvedValue(mockSessionState);
      ConversationService.processTurn.mockResolvedValue(mockTurnResponse);

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.sessionId).toBe('test-session-123');
      expect(body.type).toBe('conversational');
    });
  });

  describe('AC-02: Routing - Subsequent turn (with sessionId)', () => {
    it('should load session and return 200 when sessionId is present', async () => {
      SessionRepository.getSession.mockResolvedValue(mockSessionState);
      ConversationService.processTurn.mockResolvedValue(mockTurnResponse);

      const event = createMockEvent({
        body: JSON.stringify({ sessionId: 'test-session-123', userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(SessionRepository.getSession).toHaveBeenCalledWith('test-session-123');
      expect(ConversationService.processTurn).toHaveBeenCalledWith(
        mockSessionState,
        expect.objectContaining({ userMessage: 'Hello', sessionId: 'test-session-123' }),
      );
    });

    it('should return ok response with CORS headers on subsequent turn', async () => {
      SessionRepository.getSession.mockResolvedValue(mockSessionState);
      ConversationService.processTurn.mockResolvedValue(mockTurnResponse);

      const event = createMockEvent({
        body: JSON.stringify({ sessionId: 'test-session-123', userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.sessionId).toBe('test-session-123');
      expect(body.type).toBe('conversational');
    });
  });

  describe('AC-03: Missing session', () => {
    it('should return 404 when session does not exist', async () => {
      SessionRepository.getSession.mockResolvedValue(null);

      const event = createMockEvent({
        body: JSON.stringify({ sessionId: 'nonexistent-session', userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(404);
      expect(SessionRepository.getSession).toHaveBeenCalledWith('nonexistent-session');
      expect(ConversationService.processTurn).not.toHaveBeenCalled();
    });

    it('should return 404 response with CORS headers when session not found', async () => {
      SessionRepository.getSession.mockResolvedValue(null);

      const event = createMockEvent({
        body: JSON.stringify({ sessionId: 'nonexistent-session', userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(404);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Session not found');
    });
  });

  describe('AC-04: Successful response with CORS headers', () => {
    it('should return TurnResponse with CORS headers on success', async () => {
      SessionRepository.createSession.mockResolvedValue(mockSessionState);
      ConversationService.processTurn.mockResolvedValue(mockTurnResponse);

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toBeDefined();
      expect(response.headers['Access-Control-Allow-Headers']).toBeDefined();

      const body = JSON.parse(response.body);
      expect(body).toEqual(mockTurnResponse);
    });
  });

  describe('AC-05: Error handling', () => {
    it('should return 500 when session creation fails', async () => {
      SessionRepository.createSession.mockRejectedValue(new Error('DynamoDB error'));

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
      expect(body).not.toHaveProperty('details');
    });

    it('should return 500 when session load fails', async () => {
      SessionRepository.getSession.mockRejectedValue(new Error('DynamoDB error'));

      const event = createMockEvent({
        body: JSON.stringify({ sessionId: 'test-session-123', userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
      expect(body).not.toHaveProperty('details');
    });

    it('should return 500 when ConversationService fails', async () => {
      SessionRepository.createSession.mockResolvedValue(mockSessionState);
      ConversationService.processTurn.mockRejectedValue(new Error('Service error'));

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
      expect(body).not.toHaveProperty('details');
    });

    it('should return 500 without leaking internal error details', async () => {
      SessionRepository.createSession.mockRejectedValue(new Error('Secret DB connection string exposed'));

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      expect(response.body).not.toContain('Secret DB connection string');
      expect(response.body).not.toContain('connection');
    });

    it('should catch and handle unhandled exceptions', async () => {
      // Force an error by passing invalid state
      SessionRepository.createSession.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('AC-06: Full scenario coverage', () => {
    it('should process valid first turn from start to finish', async () => {
      const newSession: SessionState = {
        ...mockSessionState,
        sessionId: 'new-session-id',
      };

      SessionRepository.createSession.mockResolvedValue(newSession);
      ConversationService.processTurn.mockResolvedValue({
        ...mockTurnResponse,
        sessionId: 'new-session-id',
      });

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'What skills should I learn?' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      expect(SessionRepository.createSession).toHaveBeenCalledTimes(1);
      expect(ConversationService.processTurn).toHaveBeenCalledTimes(1);

      const body = JSON.parse(response.body);
      expect(body.sessionId).toBe('new-session-id');
      expect(body.turnCount).toBe(1);
    });

    it('should process valid subsequent turn from start to finish', async () => {
      SessionRepository.getSession.mockResolvedValue(mockSessionState);
      const subsequentResponse: TurnResponse = {
        ...mockTurnResponse,
        turnCount: 2,
      };
      ConversationService.processTurn.mockResolvedValue(subsequentResponse);

      const event = createMockEvent({
        body: JSON.stringify({ sessionId: 'test-session-123', userMessage: 'Tell me more' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(SessionRepository.getSession).toHaveBeenCalledWith('test-session-123');
      expect(ConversationService.processTurn).toHaveBeenCalledTimes(1);

      const body = JSON.parse(response.body);
      expect(body.sessionId).toBe('test-session-123');
      expect(body.turnCount).toBe(2);
    });
  });
});
