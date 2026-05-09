import { BedrockError } from '../bedrock-error';

describe('BedrockError', () => {
  it('should create error with message and statusCode', () => {
    const error = new BedrockError('Bedrock API call failed');
    expect(error.message).toBe('Bedrock API call failed');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('BedrockError');
  });

  it('should include cause if provided', () => {
    const cause = new Error('Original error');
    const error = new BedrockError('Bedrock API call failed', cause);
    expect(error.cause).toEqual(cause);
  });

  it('should be instanceof Error', () => {
    const error = new BedrockError('Test error');
    expect(error instanceof Error).toBe(true);
  });

  it('should have correct prototype chain', () => {
    const error = new BedrockError('Test error');
    expect(Object.getPrototypeOf(error)).toBe(BedrockError.prototype);
  });
});
