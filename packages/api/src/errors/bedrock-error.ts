/**
 * Bedrock API error class for failures in Bedrock integration.
 * Maps to HTTP 500 Internal Server Error.
 */
export class BedrockError extends Error {
  readonly name = 'BedrockError';
  readonly statusCode = 500;
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
    Object.setPrototypeOf(this, BedrockError.prototype);
  }
}
