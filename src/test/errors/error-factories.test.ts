import { describe, it, expect } from 'vitest';
import {
  createTimeoutError,
  createNetworkError,
  createApiErrorFromStatus,
  createCancelledError,
  createConfigError,
  createMissingCredentialsError,
  createInvalidChallengeError,
  createNoChallengeError,
  createNoReceiptError,
} from '../../errors/factories';
import {
  HumanmarkNetworkError,
  HumanmarkApiError,
  HumanmarkConfigError,
  HumanmarkChallengeError,
  HumanmarkVerificationError,
} from '../../errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';
import { HumanmarkVerificationCancelledError } from '../../errors/VerificationCancelledError';
import { HTTP_STATUS } from '../../constants/http';

describe('Error Factories', () => {
  describe('createTimeoutError', () => {
    it('should create timeout error with operation', () => {
      // Act
      const error = createTimeoutError('Challenge creation');

      // Assert
      expect(error).toBeInstanceOf(HumanmarkNetworkError);
      expect(error.message).toBe('Challenge creation timed out');
      expect(error.code).toBe(ErrorCode.TIMEOUT);
    });

    it('should create timeout error without operation', () => {
      // Act
      const error = createTimeoutError();

      // Assert
      expect(error).toBeInstanceOf(HumanmarkNetworkError);
      expect(error.message).toBe('Request timed out');
      expect(error.code).toBe(ErrorCode.TIMEOUT);
    });

    it('should have proper error properties', () => {
      // Act
      const error = createTimeoutError('API call');

      // Assert
      expect(error.name).toBe('HumanmarkNetworkError');
      expect(error.timestamp).toBeDefined();
      expect(error.statusCode).toBeUndefined();
    });
  });

  describe('createNetworkError', () => {
    it('should return HumanmarkError as-is', () => {
      // Arrange
      const originalError = new HumanmarkNetworkError(
        'Original',
        ErrorCode.NETWORK_ERROR
      );

      // Act
      const error = createNetworkError(originalError);

      // Assert
      expect(error).toBe(originalError);
    });

    it('should create network error from Error instance', () => {
      // Arrange
      const originalError = new Error('Network failed');

      // Act
      const error = createNetworkError(originalError);

      // Assert
      expect(error).toBeInstanceOf(HumanmarkNetworkError);
      expect(error.message).toBe('Network failed');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    });

    it('should create network error from string', () => {
      // Act
      const error = createNetworkError('String error');

      // Assert
      expect(error).toBeInstanceOf(HumanmarkNetworkError);
      expect(error.message).toBe('Network error occurred');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    });

    it('should create network error from unknown type', () => {
      // Act
      const error = createNetworkError({ some: 'object' });

      // Assert
      expect(error).toBeInstanceOf(HumanmarkNetworkError);
      expect(error.message).toBe('Network error occurred');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    });
  });

  describe('createApiErrorFromStatus', () => {
    it('should create API key error for 401', () => {
      // Act
      const error = createApiErrorFromStatus(
        HTTP_STATUS.UNAUTHORIZED,
        'Unauthorized'
      );

      // Assert
      expect(error).toBeInstanceOf(HumanmarkApiError);
      expect(error.message).toBe('HTTP 401: Unauthorized');
      expect(error.code).toBe(ErrorCode.INVALID_API_KEY_OR_SECRET);
      expect(error.statusCode).toBe(401);
    });

    it('should create API key error for 403', () => {
      // Act
      const error = createApiErrorFromStatus(
        HTTP_STATUS.FORBIDDEN,
        'Forbidden'
      );

      // Assert
      expect(error).toBeInstanceOf(HumanmarkApiError);
      expect(error.message).toBe('HTTP 403: Forbidden');
      expect(error.code).toBe(ErrorCode.INVALID_API_KEY_OR_SECRET);
      expect(error.statusCode).toBe(403);
    });

    it('should create rate limit error for 429', () => {
      // Act
      const error = createApiErrorFromStatus(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        'Too Many Requests'
      );

      // Assert
      expect(error).toBeInstanceOf(HumanmarkApiError);
      expect(error.message).toBe('HTTP 429: Too Many Requests');
      expect(error.code).toBe(ErrorCode.RATE_LIMITED);
      expect(error.statusCode).toBe(429);
    });

    it('should create challenge expired error for 410', () => {
      // Act
      const error = createApiErrorFromStatus(HTTP_STATUS.GONE, 'Gone');

      // Assert
      expect(error).toBeInstanceOf(HumanmarkApiError);
      expect(error.message).toBe('Challenge expired');
      expect(error.code).toBe(ErrorCode.CHALLENGE_EXPIRED);
      expect(error.statusCode).toBe(410);
    });

    it('should create server error for other status codes', () => {
      // Act
      const error500 = createApiErrorFromStatus(500, 'Internal Server Error');
      const error400 = createApiErrorFromStatus(400, 'Bad Request');

      // Assert
      expect(error500.message).toBe('HTTP 500: Internal Server Error');
      expect(error500.code).toBe(ErrorCode.SERVER_ERROR);
      expect(error500.statusCode).toBe(500);

      expect(error400.message).toBe('HTTP 400: Bad Request');
      expect(error400.code).toBe(ErrorCode.SERVER_ERROR);
      expect(error400.statusCode).toBe(400);
    });
  });

  describe('createCancelledError', () => {
    it('should create verification cancelled error', () => {
      // Act
      const error = createCancelledError();

      // Assert
      expect(error).toBeInstanceOf(HumanmarkVerificationCancelledError);
      expect(error.message).toBe('User cancelled verification');
      expect(error.name).toBe('HumanmarkVerificationCancelledError');
    });
  });

  describe('createConfigError', () => {
    it('should create config error with field', () => {
      // Act
      const error = createConfigError('Invalid API key format', 'apiKey');

      // Assert
      expect(error).toBeInstanceOf(HumanmarkConfigError);
      expect(error.message).toBe('Invalid API key format');
      expect(error.code).toBe(ErrorCode.INVALID_CONFIG);
      expect(error.metadata).toEqual({ field: 'apiKey' });
    });

    it('should create config error without field', () => {
      // Act
      const error = createConfigError('Configuration is invalid');

      // Assert
      expect(error).toBeInstanceOf(HumanmarkConfigError);
      expect(error.message).toBe('Configuration is invalid');
      expect(error.code).toBe(ErrorCode.INVALID_CONFIG);
      expect(error.metadata).toBeUndefined();
    });
  });

  describe('createMissingCredentialsError', () => {
    it('should create missing credentials error', () => {
      // Act
      const error = createMissingCredentialsError('Create & Verify');

      // Assert
      expect(error).toBeInstanceOf(HumanmarkConfigError);
      expect(error.message).toBe(
        'Create & Verify mode requires additional credentials'
      );
      expect(error.code).toBe(ErrorCode.MISSING_CREDENTIALS);
      expect(error.metadata).toEqual({ mode: 'Create & Verify' });
    });

    it('should include mode in metadata', () => {
      // Act
      const error = createMissingCredentialsError('Verify-only');

      // Assert
      expect(error.message).toBe(
        'Verify-only mode requires additional credentials'
      );
      expect(error.metadata?.['mode']).toBe('Verify-only');
    });
  });

  describe('createInvalidChallengeError', () => {
    it('should create invalid challenge error with ID', () => {
      // Act
      const error = createInvalidChallengeError('invalid_challenge_123');

      // Assert
      expect(error).toBeInstanceOf(HumanmarkChallengeError);
      expect(error.message).toBe('Invalid challenge ID format');
      expect(error.code).toBe(ErrorCode.INVALID_CHALLENGE_FORMAT);
      expect(error.challenge).toBe('invalid_challenge_123');
    });

    it('should create invalid challenge error without ID', () => {
      // Act
      const error = createInvalidChallengeError();

      // Assert
      expect(error).toBeInstanceOf(HumanmarkChallengeError);
      expect(error.message).toBe('Invalid challenge ID format');
      expect(error.code).toBe(ErrorCode.INVALID_CHALLENGE_FORMAT);
      expect(error.challenge).toBeUndefined();
    });
  });

  describe('createNoChallengeError', () => {
    it('should create no active challenge error', () => {
      // Act
      const error = createNoChallengeError();

      // Assert
      expect(error).toBeInstanceOf(HumanmarkChallengeError);
      expect(error.message).toBe('No active challenge available');
      expect(error.code).toBe(ErrorCode.NO_ACTIVE_CHALLENGE);
      expect(error.challenge).toBeUndefined();
    });
  });

  describe('createNoReceiptError', () => {
    it('should create no receipt received error', () => {
      // Act
      const error = createNoReceiptError();

      // Assert
      expect(error).toBeInstanceOf(HumanmarkVerificationError);
      expect(error.message).toBe('No receipt received from verification');
      expect(error.code).toBe(ErrorCode.NO_RECEIPT_RECEIVED);
    });
  });
});
