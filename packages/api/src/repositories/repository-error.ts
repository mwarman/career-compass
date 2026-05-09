/**
 * Typed error class for repository operations.
 * All DynamoDB errors are caught and re-thrown as RepositoryError for consistent error handling.
 * Maps to HTTP 500 Internal Server Error.
 */
export class RepositoryError extends Error {
  readonly name = 'RepositoryError';
  readonly statusCode = 500;

  constructor(
    message: string,
    readonly operation: string,
    readonly cause?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, RepositoryError.prototype);
  }
}
