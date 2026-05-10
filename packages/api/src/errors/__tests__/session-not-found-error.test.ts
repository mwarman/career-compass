import { SessionNotFoundError } from '../session-not-found-error';

describe('SessionNotFoundError', () => {
  it('should create error with sessionId', () => {
    const sessionId = '12345';
    const error = new SessionNotFoundError(sessionId);
    expect(error.message).toBe(`Session not found: ${sessionId}`);
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('SessionNotFoundError');
    expect(error.sessionId).toBe(sessionId);
  });

  it('should be instanceof Error', () => {
    const error = new SessionNotFoundError('test-id');
    expect(error instanceof Error).toBe(true);
  });

  it('should have correct prototype chain', () => {
    const error = new SessionNotFoundError('test-id');
    expect(Object.getPrototypeOf(error)).toBe(SessionNotFoundError.prototype);
  });
});
