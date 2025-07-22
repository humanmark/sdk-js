import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../../core/ApiClient';
import { HumanmarkError } from '../../errors/HumanmarkError';
import {
  setupTestSuite,
  createMockErrorResponse,
  createMockResponse,
  createMockToken,
} from '../utils/test-helpers';
import { testData } from '../utils/test-data-builders';

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
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });
      const waitResponse = testData.waitResponse();

      // First call fails with network error, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValueOnce(createMockResponse(waitResponse));

      // Act
      const promise = apiClient.waitForChallengeToken(token, waitHeaders);

      // Advance timers to handle retry
      await vi.runAllTimersAsync();

      const result = await promise;

      // Assert
      expect(result).toEqual(waitResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry after max retries reached', async () => {
      // Arrange
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });

      // Always return 500 error
      mockFetch.mockResolvedValue(createMockErrorResponse(500));

      // Act & Assert
      const promise = apiClient.waitForChallengeToken(token, waitHeaders);

      // Catch the promise to prevent unhandled rejection
      const errorPromise = promise.catch((error: unknown) => error);

      // Run through all retry attempts
      await vi.runAllTimersAsync();

      // Wait for the error
      const error = await errorPromise;
      expect(error).toBeInstanceOf(HumanmarkError);
      // The actual number of retries depends on the timeout (60s for waitForChallengeToken)
      // With exponential backoff starting at 1s, we hit the timeout before MAX_RETRIES
      // Initial call + retries until timeout is reached
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(4);
      expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(10);
    });
  });

  describe('normalizeError for AbortError', () => {
    it('should handle AbortError', async () => {
      // Arrange
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });

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
      ).rejects.toThrow('Network error occurred');
    });
  });

  describe('rate limit handling', () => {
    it('should retry on 429 rate limit errors', async () => {
      // Arrange
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });
      const waitResponse = testData.waitResponse();

      // First call returns 429, second succeeds
      mockFetch
        .mockResolvedValueOnce(createMockErrorResponse(429))
        .mockResolvedValueOnce(createMockResponse(waitResponse));

      // Act
      const promise = apiClient.waitForChallengeToken(token, waitHeaders);

      // Advance timers to handle retry
      await vi.runAllTimersAsync();

      const result = await promise;

      // Assert
      expect(result).toEqual(waitResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('temporary network error handling', () => {
    it('should retry on temporary HumanmarkNetworkError', async () => {
      // Arrange
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });
      const waitResponse = testData.waitResponse();

      // First call returns 503 (temporary error), second succeeds
      mockFetch
        .mockResolvedValueOnce(createMockErrorResponse(503))
        .mockResolvedValueOnce(createMockResponse(waitResponse));

      // Act
      const promise = apiClient.waitForChallengeToken(token, waitHeaders);

      // Advance timers to handle retry
      await vi.runAllTimersAsync();

      const result = await promise;

      // Assert
      expect(result).toEqual(waitResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should map AbortError to timeout error', async () => {
      // Arrange
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });

      // Mock fetch to throw AbortError (like when request is aborted)
      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      // Act - immediately catch the promise to handle rejection
      const promise = apiClient
        .waitForChallengeToken(token, waitHeaders)
        .catch((err: unknown) => err);

      // Advance timers to handle any retries
      await vi.runAllTimersAsync();

      // Assert - AbortError should be mapped to timeout error
      const error = await promise;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Request timed out');
    });
  });
});
