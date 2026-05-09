/**
 * Unit tests for API Gateway response utilities.
 * Tests all response builder functions and CORS header inclusion.
 */

import { ok, created, badRequest, notFound, internalServerError } from '../apigateway-response';

describe('apigateway-response', () => {
  describe('CORS headers', () => {
    it('should include CORS headers in all responses', () => {
      const response = ok({ test: 'data' });

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(response.headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization');
    });

    it('should always include Content-Type header', () => {
      const response = ok({ test: 'data' });

      expect(response.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('ok() - 200 response', () => {
    it('should return 200 status code', () => {
      const response = ok({ message: 'Success' });

      expect(response.statusCode).toBe(200);
    });

    it('should serialize body to JSON string', () => {
      const responseData = { message: 'Success', count: 42 };
      const response = ok(responseData);

      expect(response.body).toBe(JSON.stringify(responseData));
    });

    it('should handle complex nested objects', () => {
      const responseData = {
        type: 'conversational',
        sessionId: 'session-123',
        assistantMessage: 'Hello',
        nested: { deep: { value: 'test' } },
      };
      const response = ok(responseData);

      const parsedBody = JSON.parse(response.body);
      expect(parsedBody).toEqual(responseData);
    });

    it('should handle arrays', () => {
      const responseData = [1, 2, 3, 'four'];
      const response = ok(responseData);

      expect(JSON.parse(response.body)).toEqual(responseData);
    });

    it('should handle null', () => {
      const response = ok(null);

      expect(response.body).toBe('null');
    });
  });

  describe('created() - 201 response', () => {
    it('should return 201 status code', () => {
      const response = created({ id: 'session-123' });

      expect(response.statusCode).toBe(201);
    });

    it('should serialize body to JSON string', () => {
      const responseData = {
        sessionId: 'session-123',
        assistantMessage: 'Welcome',
      };
      const response = created(responseData);

      expect(response.body).toBe(JSON.stringify(responseData));
    });

    it('should include CORS headers', () => {
      const response = created({ id: 'test' });

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('badRequest() - 400 response', () => {
    it('should return 400 status code', () => {
      const response = badRequest('Invalid input');

      expect(response.statusCode).toBe(400);
    });

    it('should include error message in response body', () => {
      const response = badRequest('Invalid input');

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid input');
    });

    it('should omit details when not provided', () => {
      const response = badRequest('Invalid input');

      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('details');
    });

    it('should include details when provided', () => {
      const details = { field: 'email', message: 'Invalid format' };
      const response = badRequest('Request validation failed', details);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Request validation failed');
      expect(body.details).toEqual(details);
    });

    it('should handle array details', () => {
      const details = [
        { path: 'userMessage', message: 'Required' },
        { path: 'sessionId', message: 'Invalid format' },
      ];
      const response = badRequest('Validation failed', details);

      const body = JSON.parse(response.body);
      expect(body.details).toEqual(details);
      expect(body.details).toHaveLength(2);
    });

    it('should include CORS headers', () => {
      const response = badRequest('Invalid input');

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('notFound() - 404 response', () => {
    it('should return 404 status code', () => {
      const response = notFound();

      expect(response.statusCode).toBe(404);
    });

    it('should use default message when not provided', () => {
      const response = notFound();

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not found');
    });

    it('should use custom message when provided', () => {
      const response = notFound('Session not found');

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Session not found');
    });

    it('should not include extra fields in response', () => {
      const response = notFound('Resource not found');

      const body = JSON.parse(response.body);
      expect(Object.keys(body)).toEqual(['error']);
    });

    it('should include CORS headers', () => {
      const response = notFound();

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('internalServerError() - 500 response', () => {
    it('should return 500 status code', () => {
      const response = internalServerError();

      expect(response.statusCode).toBe(500);
    });

    it('should return generic error message without details', () => {
      const response = internalServerError();

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
      expect(Object.keys(body)).toEqual(['error']);
    });

    it('should not include any sensitive information', () => {
      const response = internalServerError();

      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('stack');
      expect(body).not.toHaveProperty('details');
      expect(body).not.toHaveProperty('context');
    });

    it('should include CORS headers', () => {
      const response = internalServerError();

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('Response structure', () => {
    it('should have statusCode, headers, and body properties', () => {
      const response = ok({ data: 'test' });

      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('headers');
      expect(response).toHaveProperty('body');
    });

    it('should always have body as string', () => {
      const testCases = [ok({ a: 1 }), created({}), badRequest('test'), notFound(), internalServerError()];

      testCases.forEach((response) => {
        expect(typeof response.body).toBe('string');
        expect(() => JSON.parse(response.body)).not.toThrow();
      });
    });

    it('should always have headers as object', () => {
      const testCases = [ok({ a: 1 }), created({}), badRequest('test'), notFound(), internalServerError()];

      testCases.forEach((response) => {
        expect(typeof response.headers).toBe('object');
        expect(response.headers).not.toBeNull();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty object', () => {
      const response = ok({});

      expect(response.body).toBe('{}');
      expect(response.statusCode).toBe(200);
    });

    it('should handle string with special characters', () => {
      const responseData = { message: 'Error: "quote" and \\backslash' };
      const response = ok(responseData);

      const parsed = JSON.parse(response.body);
      expect(parsed.message).toBe(responseData.message);
    });

    it('should handle large objects', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `value-${i}` })),
      };
      const response = ok(largeObject);

      const parsed = JSON.parse(response.body);
      expect(parsed.data).toHaveLength(1000);
    });

    it('should handle unicode characters', () => {
      const responseData = { message: '你好世界 🌍 مرحبا' };
      const response = ok(responseData);

      const parsed = JSON.parse(response.body);
      expect(parsed.message).toBe(responseData.message);
    });
  });
});
