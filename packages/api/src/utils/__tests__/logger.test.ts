import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { Logger, LogContext } from '../logger';

describe('logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('log()', () => {
    it('should output JSON with level and message', () => {
      Logger.log('info', 'Test message');

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.level).toBe('info');
      expect(logged.message).toBe('Test message');
      expect(logged.timestamp).toBeDefined();
    });

    it('should include context in log entry', () => {
      const context: LogContext = {
        sessionId: 'session-123',
        turnCount: 2,
      };
      Logger.log('debug', 'Processing turn', context);

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.sessionId).toBe('session-123');
      expect(logged.turnCount).toBe(2);
    });

    it('should serialize Error objects in context', () => {
      const error = new Error('Test error');
      Logger.log('error', 'An error occurred', { error });

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.error.message).toBe('Test error');
      expect(logged.error.type).toBe('Error');
      expect(logged.error.stack).toBeDefined();
    });

    it('should handle non-Error objects as errors', () => {
      Logger.log('error', 'Caught unknown error', { error: 'string error' });

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.error.message).toBe('string error');
      expect(logged.error.type).toBe('string');
    });

    it('should support all log levels', () => {
      const levels = ['debug', 'info', 'warn', 'error'] as const;

      levels.forEach((level) => {
        consoleSpy.mockClear();
        Logger.log(level, `Message at ${level}`);

        const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(logged.level).toBe(level);
      });
    });

    it('should include durationMs if provided', () => {
      Logger.log('info', 'Operation completed', { durationMs: 234 });

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.durationMs).toBe(234);
    });
  });

  describe('convenience functions', () => {
    it('debug() should call log with debug level', () => {
      Logger.debug('Debug message', { sessionId: 'test-123' });

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.level).toBe('debug');
      expect(logged.message).toBe('Debug message');
      expect(logged.sessionId).toBe('test-123');
    });

    it('info() should call log with info level', () => {
      Logger.info('Info message');

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.level).toBe('info');
      expect(logged.message).toBe('Info message');
    });

    it('warn() should call log with warn level', () => {
      Logger.warn('Warning message');

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.level).toBe('warn');
    });

    it('error() should call log with error level', () => {
      Logger.error('Error message');

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.level).toBe('error');
    });
  });

  describe('error serialization', () => {
    it('should extract error message and type', () => {
      class CustomError extends Error {
        name = 'CustomError';
      }

      const error = new CustomError('Custom message');
      Logger.log('error', 'Test', { error });

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.error.message).toBe('Custom message');
      expect(logged.error.type).toBe('CustomError');
    });

    it('should include stack trace in production logs', () => {
      const error = new Error('Stack trace test');
      Logger.log('error', 'Test', { error });

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.error.stack).toContain('Error: Stack trace test');
    });
  });
});
