import { RepositoryError } from '../repository-error';

describe('RepositoryError', () => {
  it('should create error with message, operation, and statusCode', () => {
    const cause = new Error('DynamoDB connection failed');
    const error = new RepositoryError('Failed to get session 123', 'getSession', cause);

    expect(error.message).toBe('Failed to get session 123');
    expect(error.statusCode).toBe(500);
    expect(error.operation).toBe('getSession');
    expect(error.cause).toBe(cause);
    expect(error.name).toBe('RepositoryError');
  });

  it('should work without cause', () => {
    const error = new RepositoryError('Failed to create session', 'createSession');

    expect(error.message).toBe('Failed to create session');
    expect(error.statusCode).toBe(500);
    expect(error.operation).toBe('createSession');
    expect(error.cause).toBeUndefined();
  });

  it('should be instanceof Error', () => {
    const error = new RepositoryError('Test error', 'test');
    expect(error instanceof Error).toBe(true);
  });

  it('should have correct prototype chain', () => {
    const error = new RepositoryError('Test error', 'test');
    expect(Object.getPrototypeOf(error)).toBe(RepositoryError.prototype);
  });

  it('should have statusCode property set to 500', () => {
    const error = new RepositoryError('Any repository error', 'anyOp');
    expect(error.statusCode).toBe(500);
  });
});
