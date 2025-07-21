/**
 * Error factory functions
 * Simplified error creation with consistent messages
 */

import {
  HumanmarkError,
  HumanmarkNetworkError,
  HumanmarkApiError,
  HumanmarkConfigError,
  HumanmarkChallengeError,
  HumanmarkVerificationError,
} from './HumanmarkError';
import { ErrorCode } from '@/types/errors';
import { HumanmarkVerificationCancelledError } from './VerificationCancelledError';
import { HTTP_STATUS } from '@/constants/http';
import { categorizeNetworkError } from '@/utils/http';

/**
 * Creates a network timeout error
 */
export function createTimeoutError(operation?: string): HumanmarkNetworkError {
  const message = operation ? `${operation} timed out` : 'Request timed out';
  return new HumanmarkNetworkError(message, ErrorCode.TIMEOUT);
}

/**
 * Creates a network error from an unknown error
 */
export function createNetworkError(error: unknown): HumanmarkNetworkError {
  if (error instanceof HumanmarkError) {
    return error as HumanmarkNetworkError;
  }

  const message =
    error instanceof Error ? error.message : 'Network error occurred';

  // Categorize the error
  const category = categorizeNetworkError(error);

  return new HumanmarkNetworkError(
    message,
    ErrorCode.NETWORK_ERROR,
    undefined,
    { errorCategory: category }
  );
}

/**
 * Creates an API error based on HTTP status
 */
export function createApiErrorFromStatus(
  status: number,
  statusText: string
): HumanmarkApiError {
  let code: string;
  let message: string;

  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
    case HTTP_STATUS.FORBIDDEN:
      code = ErrorCode.INVALID_API_KEY_OR_SECRET;
      message = `HTTP ${status}: ${statusText}`;
      break;
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      code = ErrorCode.RATE_LIMITED;
      message = `HTTP ${status}: ${statusText}`;
      break;
    case HTTP_STATUS.GONE:
      code = ErrorCode.CHALLENGE_EXPIRED;
      message = 'Challenge expired';
      break;
    default:
      code = ErrorCode.SERVER_ERROR;
      message = `HTTP ${status}: ${statusText}`;
  }

  return new HumanmarkApiError(message, code, status);
}

/**
 * Creates a cancelled verification error
 */
export function createCancelledError(): HumanmarkVerificationCancelledError {
  return new HumanmarkVerificationCancelledError('User cancelled verification');
}

/**
 * Creates a config validation error
 */
export function createConfigError(
  message: string,
  field?: string
): HumanmarkConfigError {
  const metadata = field ? { field } : undefined;
  return new HumanmarkConfigError(message, ErrorCode.INVALID_CONFIG, metadata);
}

/**
 * Creates a missing credentials error
 */
export function createMissingCredentialsError(
  mode: string
): HumanmarkConfigError {
  return new HumanmarkConfigError(
    `${mode} mode requires additional credentials`,
    ErrorCode.MISSING_CREDENTIALS,
    { mode }
  );
}

/**
 * Creates an invalid challenge error
 */
export function createInvalidChallengeError(
  challenge?: string
): HumanmarkChallengeError {
  return new HumanmarkChallengeError(
    'Invalid challenge ID format',
    ErrorCode.INVALID_CHALLENGE_FORMAT,
    challenge
  );
}

/**
 * Creates a no active challenge error
 */
export function createNoChallengeError(): HumanmarkChallengeError {
  return new HumanmarkChallengeError(
    'No active challenge available',
    ErrorCode.NO_ACTIVE_CHALLENGE
  );
}

/**
 * Creates a no receipt received error
 */
export function createNoReceiptError(): HumanmarkVerificationError {
  return new HumanmarkVerificationError(
    'No receipt received from verification',
    ErrorCode.NO_RECEIPT_RECEIVED
  );
}
