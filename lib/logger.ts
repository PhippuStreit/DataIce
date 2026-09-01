type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const createLogEntry = (level: LogLevel, event: string, context: Record<string, unknown> = {}) => ({
  timestamp: new Date().toISOString(),
  level,
  event,
  ...context,
});

export const logger = {
  debug: (event: string, context?: Record<string, unknown>) => console.debug(createLogEntry('debug', event, context)),
  info: (event: string, context?: Record<string, unknown>) => console.info(createLogEntry('info', event, context)),
  warn: (event: string, context?: Record<string, unknown>) => console.warn(createLogEntry('warn', event, context)),
  error: (event: string, context?: Record<string, unknown>) => console.error(createLogEntry('error', event, context)),
};
