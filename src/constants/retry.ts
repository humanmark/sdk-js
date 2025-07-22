/**
 * Retry configuration constants
 * Controls retry behavior for API requests
 */

/**
 * Time unit conversion constants
 */
export const TIME_UNITS = {
  /** Milliseconds per second */
  MS_PER_SECOND: 1000,
  /** Milliseconds per minute */
  MS_PER_MINUTE: 60000,
} as const;

export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: 20,
  /** Initial delay before first retry in milliseconds */
  INITIAL_DELAY_MS: TIME_UNITS.MS_PER_SECOND,
  /** Factor by which to multiply the delay for each retry */
  BACKOFF_FACTOR: 2,
  /** Random jitter factor to prevent thundering herd (±10%) */
  JITTER_FACTOR: 0.1,
} as const;

/**
 * Timeout configuration constants
 * Different timeout values for various operations
 */
export const TIMEOUT_CONFIG = {
  /** Total timeout for wait challenge operation (10 minutes) */
  WAIT_CHALLENGE_TOTAL_MS: 10 * TIME_UNITS.MS_PER_MINUTE,
  /** Single request timeout (must be > 25s server timeout) */
  SINGLE_REQUEST_MS: 30 * TIME_UNITS.MS_PER_SECOND,
} as const;

/**
 * Special timeout values
 */
export const SPECIAL_VALUES = {
  /** Return value indicating no expiry is set */
  NO_EXPIRY: -1,
  /** Minimum value for time calculations */
  MIN_TIME: 0,
} as const;
