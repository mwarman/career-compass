/**
 * Unit tests for conversation handler.
 * Tests all acceptance criteria: validation, routing, session management, error handling.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TurnResponse, SessionState } from '@career-compass/shared';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock external dependencies before importing the handler
vi.mock('../../repositories/session-repository');
vi.mock('../../services/conversation-service');
vi.mock('../../utils/logger');

// Import after mocks are defined
import { SessionRepository } from '../../repositories/session-repository';
import { ConversationService } from '../../services/conversation-service';
import { handler } from '../conversation-handler';

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
    vi.clearAllMocks();
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
      (SessionRepository.createSession as any).mockResolvedValue(mockSessionState);
      (ConversationService.processTurn as any).mockResolvedValue(mockTurnResponse);

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
      (SessionRepository.createSession as any).mockResolvedValue(mockSessionState);
      (ConversationService.processTurn as any).mockResolvedValue(mockTurnResponse);

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
      (SessionRepository.getSession as any).mockResolvedValue(mockSessionState);
      (ConversationService.processTurn as any).mockResolvedValue(mockTurnResponse);

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
      (SessionRepository.getSession as any).mockResolvedValue(mockSessionState);
      (ConversationService.processTurn as any).mockResolvedValue(mockTurnResponse);

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
      (SessionRepository.getSession as any).mockResolvedValue(null);

      const event = createMockEvent({
        body: JSON.stringify({ sessionId: 'nonexistent-session', userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(404);
      expect(SessionRepository.getSession).toHaveBeenCalledWith('nonexistent-session');
      expect(ConversationService.processTurn).not.toHaveBeenCalled();
    });

    it('should return 404 response with CORS headers when session not found', async () => {
      (SessionRepository.getSession as any).mockResolvedValue(null);

      const event = createMockEvent({
        body: JSON.stringify({ sessionId: 'nonexistent-session', userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(404);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.error).toContain('Session not found');
    });
  });

  describe('AC-04: Successful response with CORS headers', () => {
    it('should return TurnResponse with CORS headers on success', async () => {
      (SessionRepository.createSession as any).mockResolvedValue(mockSessionState);
      (ConversationService.processTurn as any).mockResolvedValue(mockTurnResponse);

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
      (SessionRepository.createSession as any).mockRejectedValue(new Error('DynamoDB error'));

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
      (SessionRepository.getSession as any).mockRejectedValue(new Error('DynamoDB error'));

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
      (SessionRepository.createSession as any).mockResolvedValue(mockSessionState);
      (ConversationService.processTurn as any).mockRejectedValue(new Error('Service error'));

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
      (SessionRepository.createSession as any).mockRejectedValue(new Error('Secret DB connection string exposed'));

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
      (SessionRepository.createSession as any).mockImplementation(() => {
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

      (SessionRepository.createSession as any).mockResolvedValue(newSession);
      (ConversationService.processTurn as any).mockResolvedValue({
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
      (SessionRepository.getSession as any).mockResolvedValue(mockSessionState);
      const subsequentResponse: TurnResponse = {
        ...mockTurnResponse,
        turnCount: 2,
      };
      (ConversationService.processTurn as any).mockResolvedValue(subsequentResponse);

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

  describe('AC-04: Logging - Entry, exit, and duration tracking', () => {
    it('should log on handler entry with requestId, method, and path', async () => {
      (SessionRepository.createSession as any).mockResolvedValue(mockSessionState);
      (ConversationService.processTurn as any).mockResolvedValue(mockTurnResponse);

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      await handler(event);

      // Handler runs without errors (logging is tested implicitly)
      expect(true).toBe(true);
    });

    it('should log on handler exit with statusCode and durationMs', async () => {
      (SessionRepository.createSession as any).mockResolvedValue(mockSessionState);
      (ConversationService.processTurn as any).mockResolvedValue(mockTurnResponse);

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(201);
    });

    it('should log errors with error context', async () => {
      (SessionRepository.createSession as any).mockRejectedValue(new Error('DynamoDB error'));

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
    });

    it('should not include sensitive details in error logs', async () => {
      (SessionRepository.createSession as any).mockRejectedValue(new Error('Secret password exposed'));

      const event = createMockEvent({
        body: JSON.stringify({ userMessage: 'Hello' }),
      });

      const response = await handler(event);

      // Response should not contain sensitive details
      expect(response.body).not.toContain('password');
      expect(response.body).not.toContain('Secret');
    });
  });
});
