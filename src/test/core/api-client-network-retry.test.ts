import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../../core/ApiClient';
import {
  HumanmarkError,
  HumanmarkChallengeError,
} from '../../errors/HumanmarkError';
import {
  setupTestSuite,
  createMockErrorResponse,
  createMockResponse,
} from '../utils/test-helpers';

describe('ApiClient - Network Error Retry Logic', () => {
  const { mockFetch } = setupTestSuite();
  let apiClient: ApiClient;
  const mockBaseUrl = 'https://api.example.com';

  beforeEach(() => {
    apiClient = new ApiClient(mockBaseUrl);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('shouldRetry logic for temporary network errors', () => {
    it('should retry on network errors', async () => {
      // Arrange
      const createHeaders = {
        'hm-api-key': 'test-key',
        'hm-api-secret': 'test-secret',
      };
      const createRequest = { domain: 'example.com' };

      // First call fails with network error, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValueOnce(
          createMockResponse({ token: 'challenge-token' })
        );

      // Act
      const promise = apiClient.createChallenge(createRequest, createHeaders);

      // Advance timers to handle retry
      await vi.runAllTimersAsync();

      const result = await promise;

      // Assert
      expect(result).toEqual({ token: 'challenge-token' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry after max retries reached', async () => {
      // Arrange
      const createHeaders = {
        'hm-api-key': 'test-key',
        'hm-api-secret': 'test-secret',
      };
      const createRequest = { domain: 'example.com' };

      // Always return 500 error
      mockFetch.mockResolvedValue(createMockErrorResponse(500));

      // Act & Assert
      const promise = apiClient.createChallenge(createRequest, createHeaders);

      // Catch the promise to prevent unhandled rejection
      const errorPromise = promise.catch((error: unknown) => error);

      // Run through all retry attempts
      await vi.runAllTimersAsync();

      // Wait for the error
      const error = await errorPromise;
      expect(error).toBeInstanceOf(HumanmarkError);
      // The actual number of retries depends on the timeout (60s for createChallenge)
      // With exponential backoff starting at 1s, we hit the timeout before MAX_RETRIES
      // Initial call + retries until timeout is reached
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(4);
      expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(6);
    });
  });

  describe('normalizeError for AbortError', () => {
    it('should handle AbortError', async () => {
      // Arrange
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = 'test-shard_' + btoa('test-challenge');

      // Create an AbortError
      const abortError = new DOMException(
        'The operation was aborted',
        'AbortError'
      );

      // Mock fetch to throw AbortError
      mockFetch.mockRejectedValueOnce(abortError);

      // Act & Assert
      await expect(
        apiClient.waitForChallengeToken(token, waitHeaders)
      ).rejects.toThrow(HumanmarkChallengeError);
    });
  });

  describe('rate limit handling', () => {
    it('should retry on 429 rate limit errors', async () => {
      // Arrange
      const createHeaders = {
        'hm-api-key': 'test-key',
        'hm-api-secret': 'test-secret',
      };
      const createRequest = { domain: 'example.com' };

      // First call returns 429, second succeeds
      mockFetch
        .mockResolvedValueOnce(createMockErrorResponse(429))
        .mockResolvedValueOnce(
          createMockResponse({ token: 'challenge-token' })
        );

      // Act
      const promise = apiClient.createChallenge(createRequest, createHeaders);

      // Advance timers to handle retry
      await vi.runAllTimersAsync();

      const result = await promise;

      // Assert
      expect(result).toEqual({ token: 'challenge-token' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
