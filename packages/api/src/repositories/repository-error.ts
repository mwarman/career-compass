/**
 * Typed error class for repository operations.
 * All DynamoDB errors are caught and re-thrown as RepositoryError for consistent error handling.
 */
export class RepositoryError extends Error {
  readonly name = 'RepositoryError';

  constructor(
    message: string,
    readonly operation: string,
    readonly cause?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, RepositoryError.prototype);
  }
}
