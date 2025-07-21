/**
 * Error-related types and interfaces
 */

/**
 * Standard error codes used throughout the SDK
 */
export enum ErrorCode {
  // Configuration errors
  INVALID_API_KEY = 'invalid_api_key',
  INVALID_CONFIG = 'invalid_config',
  MISSING_CREDENTIALS = 'missing_credentials',

  // Network errors
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  INVALID_RESPONSE = 'invalid_response',

  // API errors
  INVALID_API_KEY_OR_SECRET = 'invalid_api_key_or_secret',
  RATE_LIMITED = 'rate_limited',
  SERVER_ERROR = 'server_error',

  // Challenge errors
  CHALLENGE_EXPIRED = 'challenge_expired',
  CHALLENGE_NOT_FOUND = 'challenge_not_found',
  INVALID_CHALLENGE_FORMAT = 'invalid_challenge_format',
  NO_ACTIVE_CHALLENGE = 'no_active_challenge',

  // Verification errors
  VERIFICATION_FAILED = 'verification_failed',
  NO_RECEIPT_RECEIVED = 'no_receipt_received',

  // Client errors
  MODULE_LOAD_FAILED = 'module_load_failed',
  QR_CODE_GENERATION_FAILED = 'qr_code_generation_failed',
  USER_CANCELLED = 'user_cancelled',
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Extended error information
 */
export interface ErrorMetadata extends Record<string, unknown> {
  /**
   * HTTP status code if applicable
   */
  statusCode?: number;

  /**
   * Request ID for tracking
   */
  requestId?: string;

  /**
   * Additional context about the error
   */
  context?: Record<string, unknown>;

  /**
   * Error severity
   */
  severity?: ErrorSeverity;

  /**
   * Whether the error is recoverable
   */
  recoverable?: boolean;

  /**
   * Suggested action for the user
   */
  userAction?: string;
}

/**
 * Serialized error format for logging
 */
export interface SerializedError {
  /**
   * Error name/type
   */
  name: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Error code
   */
  code: string;

  /**
   * Stack trace
   */
  stack?: string;

  /**
   * When the error occurred
   */
  timestamp: string;

  /**
   * Additional metadata
   */
  metadata?: ErrorMetadata;
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: Error) => void | Promise<void>;

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  /**
   * Whether to retry the operation
   */
  shouldRetry: boolean;

  /**
   * Delay before retry in milliseconds
   */
  retryDelay?: number;

  /**
   * Maximum number of retries
   */
  maxRetries?: number;

  /**
   * Alternative action if retry fails
   */
  fallbackAction?: () => void | Promise<void>;
}
