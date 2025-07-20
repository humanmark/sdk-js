import { describe, it, expect } from 'vitest';
import {
  isServerError,
  isRetryableStatus,
  isApiKeyError,
  isRetryableNetworkError,
  createFetchOptions,
  getErrorMessage,
} from '../../utils/http';
import { HTTP_STATUS } from '../../constants/http';

describe('HTTP Utilities', () => {
  describe('isServerError', () => {
    it('should return true for 5xx status codes', () => {
      // Assert
      expect(isServerError(500)).toBe(true);
      expect(isServerError(501)).toBe(true);
      expect(isServerError(502)).toBe(true);
      expect(isServerError(503)).toBe(true);
      expect(isServerError(504)).toBe(true);
      expect(isServerError(599)).toBe(true);
    });

    it('should return false for non-5xx status codes', () => {
      // Assert
      expect(isServerError(200)).toBe(false);
      expect(isServerError(400)).toBe(false);
      expect(isServerError(404)).toBe(false);
      expect(isServerError(499)).toBe(false);
      expect(isServerError(600)).toBe(false);
    });
  });

  describe('isRetryableStatus', () => {
    it('should return true for server errors', () => {
      // Assert
      expect(isRetryableStatus(500)).toBe(true);
      expect(isRetryableStatus(502)).toBe(true);
      expect(isRetryableStatus(503)).toBe(true);
    });

    it('should return true for rate limit (429)', () => {
      // Assert
      expect(isRetryableStatus(HTTP_STATUS.TOO_MANY_REQUESTS)).toBe(true);
      expect(isRetryableStatus(429)).toBe(true);
    });

    it('should return false for client errors except 429', () => {
      // Assert
      expect(isRetryableStatus(400)).toBe(false);
      expect(isRetryableStatus(401)).toBe(false);
      expect(isRetryableStatus(403)).toBe(false);
      expect(isRetryableStatus(404)).toBe(false);
    });

    it('should return false for success codes', () => {
      // Assert
      expect(isRetryableStatus(200)).toBe(false);
      expect(isRetryableStatus(201)).toBe(false);
      expect(isRetryableStatus(204)).toBe(false);
    });
  });

  describe('isApiKeyError', () => {
    it('should return true for 401 Unauthorized', () => {
      // Assert
      expect(isApiKeyError(HTTP_STATUS.UNAUTHORIZED)).toBe(true);
      expect(isApiKeyError(401)).toBe(true);
    });

    it('should return true for 403 Forbidden', () => {
      // Assert
      expect(isApiKeyError(HTTP_STATUS.FORBIDDEN)).toBe(true);
      expect(isApiKeyError(403)).toBe(true);
    });

    it('should return false for other status codes', () => {
      // Assert
      expect(isApiKeyError(200)).toBe(false);
      expect(isApiKeyError(400)).toBe(false);
      expect(isApiKeyError(404)).toBe(false);
      expect(isApiKeyError(500)).toBe(false);
    });
  });

  describe('isRetryableNetworkError', () => {
    it('should return false for AbortError (intentional cancellation)', () => {
      // Arrange
      const error = new Error('Operation aborted');
      error.name = 'AbortError';

      // Act & Assert
      expect(isRetryableNetworkError(error)).toBe(false);
    });

    it('should return true for TypeError', () => {
      // Arrange
      const error = new TypeError('Network request failed');

      // Act & Assert
      expect(isRetryableNetworkError(error)).toBe(true);
    });

    it('should return true for "Failed to fetch" message', () => {
      // Arrange
      const error = new Error('Failed to fetch');

      // Act & Assert
      expect(isRetryableNetworkError(error)).toBe(true);
    });

    it('should return true for "Network request failed" message', () => {
      // Arrange
      const error = new Error('Network request failed');

      // Act & Assert
      expect(isRetryableNetworkError(error)).toBe(true);
    });

    it('should return false for non-Error objects', () => {
      // Act & Assert
      expect(isRetryableNetworkError('string error')).toBe(false);
      expect(isRetryableNetworkError(null)).toBe(false);
      expect(isRetryableNetworkError(undefined)).toBe(false);
      expect(isRetryableNetworkError({})).toBe(false);
      expect(isRetryableNetworkError(123)).toBe(false);
    });

    it('should return false for other error types', () => {
      // Arrange
      const error = new Error('Some other error');

      // Act & Assert
      expect(isRetryableNetworkError(error)).toBe(false);
    });

    it('should handle errors with empty message', () => {
      // Arrange
      const error = new Error(); // Error() creates an error with empty string message

      // Act & Assert
      expect(isRetryableNetworkError(error)).toBe(false);
    });
  });

  describe('createFetchOptions', () => {
    it('should create basic fetch options', () => {
      // Act
      const options = createFetchOptions('GET', {
        'Content-Type': 'application/json',
      });

      // Assert
      expect(options).toEqual({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should include abort signal when provided', () => {
      // Arrange
      const controller = new AbortController();

      // Act
      const options = createFetchOptions(
        'POST',
        { Authorization: 'Bearer token' },
        undefined,
        controller.signal
      );

      // Assert
      expect(options.signal).toBe(controller.signal);
    });

    it('should stringify object body', () => {
      // Arrange
      const body = { name: 'Test', value: 123 };

      // Act
      const options = createFetchOptions('POST', {}, body);

      // Assert
      expect(options.body).toBe(JSON.stringify(body));
    });

    it('should preserve string body', () => {
      // Arrange
      const body = 'raw string body';

      // Act
      const options = createFetchOptions('PUT', {}, body);

      // Assert
      expect(options.body).toBe(body);
    });

    it('should handle undefined body', () => {
      // Act
      const options = createFetchOptions('DELETE', {});

      // Assert
      expect(options.body).toBeUndefined();
    });

    it('should include all options when provided', () => {
      // Arrange
      const controller = new AbortController();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      };
      const body = { data: 'test' };

      // Act
      const options = createFetchOptions(
        'PATCH',
        headers,
        body,
        controller.signal
      );

      // Assert
      expect(options).toEqual({
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      // Arrange
      const error = new Error('Test error message');

      // Act & Assert
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return string error as-is', () => {
      // Act & Assert
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return default message for unknown types', () => {
      // Act & Assert
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
      expect(getErrorMessage(123)).toBe('Unknown error occurred');
      expect(getErrorMessage({})).toBe('Unknown error occurred');
      expect(getErrorMessage([])).toBe('Unknown error occurred');
      expect(getErrorMessage(true)).toBe('Unknown error occurred');
    });

    it('should handle custom error types', () => {
      // Arrange
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const error = new CustomError('Custom error message');

      // Act & Assert
      expect(getErrorMessage(error)).toBe('Custom error message');
    });

    it('should handle error without message property', () => {
      // Arrange
      const error = new Error();

      // Act & Assert
      expect(getErrorMessage(error)).toBe('');
    });
  });
});
