import { ValidationError } from '../validation-error';

describe('ValidationError', () => {
  it('should create error with message and statusCode', () => {
    const error = new ValidationError('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('ValidationError');
  });

  it('should include details if provided', () => {
    const details = [{ path: 'email', message: 'Invalid email format' }];
    const error = new ValidationError('Request validation failed', details);
    expect(error.details).toEqual(details);
  });

  it('should be instanceof Error', () => {
    const error = new ValidationError('Test error');
    expect(error instanceof Error).toBe(true);
  });

  it('should have correct prototype chain', () => {
    const error = new ValidationError('Test error');
    expect(Object.getPrototypeOf(error)).toBe(ValidationError.prototype);
  });
});
