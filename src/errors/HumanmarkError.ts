import { HTTP_STATUS } from '@/constants/http';
import type { ErrorMetadata, SerializedError } from '@/types/errors';
import { ErrorCode } from '@/types/errors';

/**
 * Base error class for all Humanmark SDK errors
 */
export class HumanmarkError extends Error {
  /**
   * Machine-readable error code for programmatic handling
   */
  public readonly code: string;

  /**
   * HTTP status code if applicable
   */
  public readonly statusCode?: number;

  /**
   * Additional metadata for debugging
   */
  public readonly metadata?: ErrorMetadata;

  /**
   * Timestamp when error occurred
   */
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string | ErrorCode,
    statusCode?: number,
    metadata?: ErrorMetadata
  ) {
    super(message);
    this.name = 'HumanmarkError';
    this.code = code;
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
    if (metadata !== undefined) {
      this.metadata = metadata;
    }
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a JSON representation of the error for logging
   */
  toJSON(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      ...(this.stack && { stack: this.stack }),
      ...(this.metadata && {
        metadata: {
          ...this.metadata,
          ...(this.statusCode && { statusCode: this.statusCode }),
        },
      }),
    };
  }
}

/**
 * Configuration-related errors
 */
export class HumanmarkConfigError extends HumanmarkError {
  constructor(
    message: string,
    code: string | ErrorCode,
    metadata?: ErrorMetadata
  ) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, metadata);
    this.name = 'HumanmarkConfigError';
  }
}

/**
 * Network and API communication errors
 */
export class HumanmarkNetworkError extends HumanmarkError {
  public readonly isTemporary: boolean;
  public readonly errorCategory: 'temporary' | 'permanent' | 'unknown';

  constructor(
    message: string,
    code: string | ErrorCode,
    statusCode?: number,
    metadata?: ErrorMetadata & {
      errorCategory?: 'temporary' | 'permanent' | 'unknown';
    }
  ) {
    super(message, code, statusCode, metadata);
    this.name = 'HumanmarkNetworkError';
    this.errorCategory = metadata?.errorCategory ?? 'unknown';
    this.isTemporary = this.errorCategory === 'temporary';
  }
}

/**
 * API-related errors (invalid keys, rate limits, etc.)
 */
export class HumanmarkApiError extends HumanmarkError {
  constructor(
    message: string,
    code: string | ErrorCode,
    statusCode?: number,
    metadata?: ErrorMetadata
  ) {
    super(message, code, statusCode ?? HTTP_STATUS.BAD_REQUEST, metadata);
    this.name = 'HumanmarkApiError';
  }
}

/**
 * Verification process errors
 */
export class HumanmarkVerificationError extends HumanmarkError {
  constructor(
    message: string,
    code: string | ErrorCode,
    metadata?: ErrorMetadata
  ) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, metadata);
    this.name = 'HumanmarkVerificationError';
  }
}

/**
 * Challenge-related errors
 */
export class HumanmarkChallengeError extends HumanmarkError {
  public readonly challenge?: string;

  constructor(
    message: string,
    code: string | ErrorCode,
    challenge?: string,
    metadata?: ErrorMetadata
  ) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, { ...metadata, challenge });
    this.name = 'HumanmarkChallengeError';
    if (challenge !== undefined) {
      this.challenge = challenge;
    }
  }
}

/**
 * Type guard to check if an error is a HumanmarkError
 */
export function isHumanmarkError(error: unknown): error is HumanmarkError {
  return error instanceof HumanmarkError;
}

/**
 * Type guard for specific error types
 */
export function isHumanmarkConfigError(
  error: unknown
): error is HumanmarkConfigError {
  return error instanceof HumanmarkConfigError;
}

export function isHumanmarkNetworkError(
  error: unknown
): error is HumanmarkNetworkError {
  return error instanceof HumanmarkNetworkError;
}

export function isHumanmarkApiError(
  error: unknown
): error is HumanmarkApiError {
  return error instanceof HumanmarkApiError;
}

export function isHumanmarkVerificationError(
  error: unknown
): error is HumanmarkVerificationError {
  return error instanceof HumanmarkVerificationError;
}

export function isHumanmarkChallengeError(
  error: unknown
): error is HumanmarkChallengeError {
  return error instanceof HumanmarkChallengeError;
}
