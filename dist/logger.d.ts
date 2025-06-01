/**
 * Kotlineum logger utility
 * Provides consistent logging across the package with [Kotlineum] prefix
 */
/**
 * Log levels for Kotlineum logger
 */
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
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
 * Configure the logger
 * @param config Logger configuration
 */
export declare function configureLogger(config: Partial<LoggerConfig>): void;
/**
 * Get the current logger configuration
 */
export declare function getLoggerConfig(): LoggerConfig;
/**
 * Log a debug message
 * @param message The message to log
 * @param args Additional arguments to log
 */
export declare function debug(message: string, ...args: any[]): void;
/**
 * Log an info message
 * @param message The message to log
 * @param args Additional arguments to log
 */
export declare function info(message: string, ...args: any[]): void;
/**
 * Log a warning message
 * @param message The message to log
 * @param args Additional arguments to log
 */
export declare function warn(message: string, ...args: any[]): void;
/**
 * Log an error message
 * @param message The message to log
 * @param args Additional arguments to log
 */
export declare function error(message: string, ...args: any[]): void;
/**
 * Logger object with all methods
 */
export declare const Logger: {
    debug: typeof debug;
    info: typeof info;
    warn: typeof warn;
    error: typeof error;
    configure: typeof configureLogger;
    getConfig: typeof getLoggerConfig;
};
export default Logger;
