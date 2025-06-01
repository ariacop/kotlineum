// logger.ts
/**
 * Kotlineum logger utility
 * Provides consistent logging across the package with [Kotlineum] prefix
 */

/**
 * Log levels for Kotlineum logger
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /**
   * Minimum log level to display
   * @default LogLevel.INFO
   */
  minLevel?: LogLevel;
  
  /**
   * Whether to include timestamps in logs
   * @default true
   */
  includeTimestamp?: boolean;
  
  /**
   * Custom prefix for logs
   * @default '[Kotlineum]'
   */
  prefix?: string;
  
  /**
   * Whether to enable logging
   * @default true
   */
  enabled?: boolean;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  minLevel: LogLevel.INFO,
  includeTimestamp: true,
  prefix: '[Kotlineum]',
  enabled: true
};

/**
 * Current logger configuration
 */
let currentConfig: LoggerConfig = { ...defaultConfig };

/**
 * Configure the logger
 * @param config Logger configuration
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get the current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...currentConfig };
}

/**
 * Format a log message with prefix and optional timestamp
 * @param message The message to format
 * @param level The log level
 */
function formatMessage(message: string, level: LogLevel): string {
  const parts: string[] = [];
  
  if (currentConfig.includeTimestamp) {
    parts.push(`${new Date().toISOString()}`);
  }
  
  parts.push(`${currentConfig.prefix || '[Kotlineum]'} [${level}]`);
  parts.push(message);
  
  return parts.join(' ');
}

/**
 * Check if a log level should be displayed
 * @param level The log level to check
 */
function shouldLog(level: LogLevel): boolean {
  if (!currentConfig.enabled) return false;
  
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const minLevelIndex = levels.indexOf(currentConfig.minLevel || LogLevel.INFO);
  const currentLevelIndex = levels.indexOf(level);
  
  return currentLevelIndex >= minLevelIndex;
}

/**
 * Log a debug message
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function debug(message: string, ...args: any[]): void {
  if (shouldLog(LogLevel.DEBUG)) {
    console.debug(formatMessage(message, LogLevel.DEBUG), ...args);
  }
}

/**
 * Log an info message
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function info(message: string, ...args: any[]): void {
  if (shouldLog(LogLevel.INFO)) {
    console.info(formatMessage(message, LogLevel.INFO), ...args);
  }
}

/**
 * Log a warning message
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function warn(message: string, ...args: any[]): void {
  if (shouldLog(LogLevel.WARN)) {
    console.warn(formatMessage(message, LogLevel.WARN), ...args);
  }
}

/**
 * Log an error message
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function error(message: string, ...args: any[]): void {
  if (shouldLog(LogLevel.ERROR)) {
    console.error(formatMessage(message, LogLevel.ERROR), ...args);
  }
}

/**
 * Logger object with all methods
 */
export const Logger = {
  debug,
  info,
  warn,
  error,
  configure: configureLogger,
  getConfig: getLoggerConfig
};

export default Logger;
