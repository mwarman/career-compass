/**
 * Session not found error class.
 * Maps to HTTP 404 Not Found.
 */
export class SessionNotFoundError extends Error {
  readonly name = 'SessionNotFoundError';
  readonly statusCode = 404;
  readonly sessionId: string;

  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.sessionId = sessionId;
    Object.setPrototypeOf(this, SessionNotFoundError.prototype);
  }
}
