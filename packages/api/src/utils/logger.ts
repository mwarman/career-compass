/**
 * Structured logging utility for Lambda handlers.
 * Produces JSON log entries compatible with CloudWatch Logs.
 * Uses console.log directly (no logger library dependency).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  sessionId?: string;
  turnCount?: number;
  durationMs?: number;
  error?: unknown;
  [key: string]: unknown;
}

/**
 * Serialize an error for logging.
 * Extracts message and type without exposing full stack trace.
 */
const serializeError = (error: unknown): { message: string; type: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.name || 'Error',
      stack: error.stack,
    };
  }
  return {
    message: String(error),
    type: typeof error,
  };
};

/**
 * Log a message with optional context.
 * Emits JSON to stdout for CloudWatch Logs ingestion.
 *
 * @param level - Log level (debug, info, warn, error)
 * @param message - Log message
 * @param context - Optional context object with session/performance details
 */
const log = (level: LogLevel, message: string, context?: LogContext): void => {
  const logEntry: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  // Add context fields if provided
  if (context) {
    Object.entries(context).forEach(([key, value]) => {
      if (key === 'error') {
        // Always serialize error values
        logEntry.error = serializeError(value);
      } else if (value !== undefined && value !== null) {
        logEntry[key] = value;
      }
    });
  }

  // CloudWatch Logs expects JSON, not JSON strings
  console.log(logEntry);
};

/**
 * Convenience function to log at debug level.
 */
const debug = (message: string, context?: LogContext): void => {
  log('debug', message, context);
};

/**
 * Convenience function to log at info level.
 */
const info = (message: string, context?: LogContext): void => {
  log('info', message, context);
};

/**
 * Convenience function to log at warn level.
 */
const warn = (message: string, context?: LogContext): void => {
  log('warn', message, context);
};

/**
 * Convenience function to log at error level.
 */
const error = (message: string, context?: LogContext): void => {
  log('error', message, context);
};

export const Logger = {
  debug,
  info,
  log,
  warn,
  error,
};
