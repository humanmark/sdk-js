import { describe, it, expect } from 'vitest';
import {
  HumanmarkError,
  HumanmarkNetworkError,
  HumanmarkApiError,
  HumanmarkConfigError,
  HumanmarkChallengeError,
  HumanmarkVerificationError,
  isHumanmarkError,
  isHumanmarkNetworkError,
  isHumanmarkConfigError,
  isHumanmarkApiError,
  isHumanmarkVerificationError,
  isHumanmarkChallengeError,
} from '../../errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';

describe('HumanmarkError', () => {
  describe('HumanmarkError base class', () => {
    it('should create error with all properties', () => {
      // Act
      const error = new HumanmarkError('Test error', ErrorCode.NETWORK_ERROR);

      // Assert
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.name).toBe('HumanmarkError');
      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });

    it('should have proper stack trace', () => {
      // Act
      const error = new HumanmarkError('Test error', ErrorCode.NETWORK_ERROR);

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('HumanmarkError');
    });

    it('should serialize to JSON correctly', () => {
      // Arrange
      const error = new HumanmarkError('Test error', ErrorCode.NETWORK_ERROR);

      // Act
      const json = JSON.parse(JSON.stringify(error)) as {
        name: string;
        message: string;
        code: string;
        timestamp: string;
      };

      // Assert
      expect(json.name).toBe('HumanmarkError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('HumanmarkNetworkError', () => {
    it('should create network error with status code', () => {
      // Act
      const error = new HumanmarkNetworkError(
        'Network failed',
        ErrorCode.NETWORK_ERROR,
        503
      );

      // Assert
      expect(error.name).toBe('HumanmarkNetworkError');
      expect(error.message).toBe('Network failed');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.statusCode).toBe(503);
    });

    it('should create network error without status code', () => {
      // Act
      const error = new HumanmarkNetworkError(
        'Connection timeout',
        ErrorCode.TIMEOUT
      );

      // Assert
      expect(error.statusCode).toBeUndefined();
    });
  });

  describe('HumanmarkApiError', () => {
    it('should always have status code', () => {
      // Act
      const error = new HumanmarkApiError(
        'API error',
        ErrorCode.SERVER_ERROR,
        500
      );

      // Assert
      expect(error.name).toBe('HumanmarkApiError');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('HumanmarkConfigError', () => {
    it('should create config error with metadata', () => {
      // Act
      const metadata = { field: 'apiKey', value: 'invalid' };
      const error = new HumanmarkConfigError(
        'Invalid config',
        ErrorCode.INVALID_CONFIG,
        metadata
      );

      // Assert
      expect(error.name).toBe('HumanmarkConfigError');
      expect(error.metadata).toEqual(metadata);
    });

    it('should create config error without metadata', () => {
      // Act
      const error = new HumanmarkConfigError(
        'Missing config',
        ErrorCode.INVALID_CONFIG
      );

      // Assert
      expect(error.metadata).toBeUndefined();
    });
  });

  describe('HumanmarkChallengeError', () => {
    it('should create challenge error with challenge ID', () => {
      // Act
      const error = new HumanmarkChallengeError(
        'Invalid challenge',
        ErrorCode.INVALID_CHALLENGE_FORMAT,
        'bad_challenge'
      );

      // Assert
      expect(error.name).toBe('HumanmarkChallengeError');
      expect(error.challenge).toBe('bad_challenge');
    });

    it('should create challenge error without challenge ID', () => {
      // Act
      const error = new HumanmarkChallengeError(
        'No active challenge',
        ErrorCode.NO_ACTIVE_CHALLENGE
      );

      // Assert
      expect(error.challenge).toBeUndefined();
    });
  });

  describe('HumanmarkVerificationError', () => {
    it('should create verification error', () => {
      // Act
      const error = new HumanmarkVerificationError(
        'Verification failed',
        ErrorCode.VERIFICATION_FAILED
      );

      // Assert
      expect(error.name).toBe('HumanmarkVerificationError');
      expect(error.code).toBe(ErrorCode.VERIFICATION_FAILED);
    });
  });

  describe('Type Guards', () => {
    const baseError = new HumanmarkError('Base', ErrorCode.NETWORK_ERROR);
    const networkError = new HumanmarkNetworkError(
      'Network',
      ErrorCode.NETWORK_ERROR
    );
    const apiError = new HumanmarkApiError('API', ErrorCode.SERVER_ERROR, 500);
    const configError = new HumanmarkConfigError(
      'Config',
      ErrorCode.INVALID_CONFIG
    );
    const challengeError = new HumanmarkChallengeError(
      'Challenge',
      ErrorCode.INVALID_CHALLENGE_FORMAT
    );
    const verificationError = new HumanmarkVerificationError(
      'Verification',
      ErrorCode.VERIFICATION_FAILED
    );
    const regularError = new Error('Regular error');
    const notAnError = { message: 'Not an error' };

    describe('isHumanmarkError', () => {
      it('should return true for all Humanmark errors', () => {
        expect(isHumanmarkError(baseError)).toBe(true);
        expect(isHumanmarkError(networkError)).toBe(true);
        expect(isHumanmarkError(apiError)).toBe(true);
        expect(isHumanmarkError(configError)).toBe(true);
        expect(isHumanmarkError(challengeError)).toBe(true);
        expect(isHumanmarkError(verificationError)).toBe(true);
      });

      it('should return false for non-Humanmark errors', () => {
        expect(isHumanmarkError(regularError)).toBe(false);
        expect(isHumanmarkError(notAnError)).toBe(false);
        expect(isHumanmarkError(null)).toBe(false);
        expect(isHumanmarkError(undefined)).toBe(false);
      });
    });

    describe('isHumanmarkNetworkError', () => {
      it('should return true only for network errors', () => {
        expect(isHumanmarkNetworkError(networkError)).toBe(true);
        expect(isHumanmarkNetworkError(baseError)).toBe(false);
        expect(isHumanmarkNetworkError(apiError)).toBe(false);
        expect(isHumanmarkNetworkError(regularError)).toBe(false);
      });
    });

    describe('isHumanmarkConfigError', () => {
      it('should return true only for config errors', () => {
        expect(isHumanmarkConfigError(configError)).toBe(true);
        expect(isHumanmarkConfigError(baseError)).toBe(false);
        expect(isHumanmarkConfigError(networkError)).toBe(false);
        expect(isHumanmarkConfigError(regularError)).toBe(false);
      });
    });

    describe('isHumanmarkApiError', () => {
      it('should return true only for API errors', () => {
        expect(isHumanmarkApiError(apiError)).toBe(true);
        expect(isHumanmarkApiError(baseError)).toBe(false);
        expect(isHumanmarkApiError(networkError)).toBe(false);
        expect(isHumanmarkApiError(regularError)).toBe(false);
      });
    });

    describe('isHumanmarkVerificationError', () => {
      it('should return true only for verification errors', () => {
        expect(isHumanmarkVerificationError(verificationError)).toBe(true);
        expect(isHumanmarkVerificationError(baseError)).toBe(false);
        expect(isHumanmarkVerificationError(challengeError)).toBe(false);
        expect(isHumanmarkVerificationError(regularError)).toBe(false);
      });
    });

    describe('isHumanmarkChallengeError', () => {
      it('should return true only for challenge errors', () => {
        expect(isHumanmarkChallengeError(challengeError)).toBe(true);
        expect(isHumanmarkChallengeError(baseError)).toBe(false);
        expect(isHumanmarkChallengeError(verificationError)).toBe(false);
        expect(isHumanmarkChallengeError(regularError)).toBe(false);
      });
    });
  });
});
