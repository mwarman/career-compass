/**
 * Validation error class for API request/response validation failures.
 * Maps to HTTP 400 Bad Request.
 */
export class ValidationError extends Error {
  readonly name = 'ValidationError';
  readonly statusCode = 400;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
