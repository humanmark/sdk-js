import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../../core/ApiClient';
import {
  HumanmarkNetworkError,
  HumanmarkApiError,
} from '../../errors/HumanmarkError';
import { ErrorCode } from '../../types/errors';
import { setupTestSuite, createMockToken } from '../utils/test-helpers';
import { testData } from '../utils/test-data-builders';

describe('HTTP Error Classification', () => {
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

  describe('Temporary vs Permanent Network Errors', () => {
    const token = createMockToken({
      shard: 'us-east-1',
      challenge: 'test-challenge',
      exp: Math.floor((Date.now() + 300000) / 1000),
    });
    const waitHeaders = { 'hm-api-key': 'test-key' };

    it('should retry on temporary network errors with isTemporary flag', async () => {
      // Arrange
      const temporaryError = new HumanmarkNetworkError(
        'Temporary network issue',
        ErrorCode.NETWORK_ERROR,
        undefined,
        {
          isTemporary: true,
          errorCategory: 'temporary',
        }
      );
      const waitResponse = testData.waitResponse();

      // First call throws temporary error, second succeeds
      mockFetch.mockRejectedValueOnce(temporaryError).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(waitResponse),
      });

      // Act
      const promise = apiClient.waitForChallengeToken(token, waitHeaders);

      // Advance timers to handle retry
      await vi.runAllTimersAsync();

      const result = await promise;

      // Assert
      expect(result).toEqual(waitResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Original + 1 retry
    });

    it('should not retry on permanent network errors without isTemporary flag', async () => {
      // Arrange
      const permanentError = new HumanmarkNetworkError(
        'SSL certificate error',
        ErrorCode.NETWORK_ERROR,
        undefined,
        {
          isTemporary: false,
          errorCategory: 'permanent',
        }
      );

      mockFetch.mockRejectedValueOnce(permanentError);

      // Act & Assert
      const promise = apiClient
        .waitForChallengeToken(token, waitHeaders)
        .catch((err: unknown) => err);

      await vi.runAllTimersAsync();

      const error = await promise;
      expect(error).toBe(permanentError);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('should retry on HumanmarkApiError with retryable status codes', async () => {
      // Arrange
      const retryableApiError = new HumanmarkApiError(
        'Service temporarily unavailable',
        ErrorCode.SERVER_ERROR,
        503
      );
      const waitResponse = testData.waitResponse();

      // First call throws 503 error, second succeeds
      mockFetch.mockRejectedValueOnce(retryableApiError).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(waitResponse),
      });

      // Act
      const promise = apiClient.waitForChallengeToken(token, waitHeaders);

      // Advance timers to handle retry
      await vi.runAllTimersAsync();

      const result = await promise;

      // Assert
      expect(result).toEqual(waitResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Original + 1 retry
    });

    it('should not retry on HumanmarkApiError with non-retryable status codes', async () => {
      // Arrange
      const nonRetryableApiError = new HumanmarkApiError(
        'Unauthorized',
        ErrorCode.INVALID_API_KEY,
        401
      );

      mockFetch.mockRejectedValueOnce(nonRetryableApiError);

      // Act & Assert
      const promise = apiClient
        .waitForChallengeToken(token, waitHeaders)
        .catch((err: unknown) => err);

      await vi.runAllTimersAsync();

      const error = await promise;
      expect(error).toBe(nonRetryableApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });
  });

  describe('Network error categorization in error factory', () => {
    it('should classify DNS errors as temporary', async () => {
      // Arrange
      const dnsError = new Error('getaddrinfo ENOTFOUND api.humanmark.io');

      mockFetch.mockRejectedValueOnce(dnsError);

      // Act
      const promise = apiClient
        .waitForChallengeToken(
          createMockToken({
            shard: 'us-east-1',
            challenge: 'test',
            exp: Math.floor((Date.now() + 300000) / 1000),
          }),
          { 'hm-api-key': 'test-key' }
        )
        .catch((err: unknown) => err);

      await vi.runAllTimersAsync();

      await promise;

      // Assert - should have retried
      expect(mockFetch.mock.calls.length).toBeGreaterThan(1);
    });

    it('should classify connection refused as temporary', async () => {
      // Arrange
      const connError = new Error('connect ECONNREFUSED 127.0.0.1:443');
      const waitResponse = testData.waitResponse();

      mockFetch.mockRejectedValueOnce(connError).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(waitResponse),
      });

      // Act
      const promise = apiClient.waitForChallengeToken(
        createMockToken({
          shard: 'us-east-1',
          challenge: 'test',
          exp: Math.floor((Date.now() + 300000) / 1000),
        }),
        { 'hm-api-key': 'test-key' }
      );

      await vi.runAllTimersAsync();

      const result = await promise;

      // Assert
      expect(result).toEqual(waitResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Original + 1 retry
    });

    it('should handle offline detection as temporary error', async () => {
      // Arrange
      // Mock navigator.onLine to return false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'offline-test',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });

      // Act & Assert
      const promise = apiClient
        .waitForChallengeToken(token, { 'hm-api-key': 'test-key' })
        .catch((err: unknown) => err);

      await vi.runAllTimersAsync();

      const error = await promise;
      expect(error).toBeInstanceOf(HumanmarkNetworkError);
      expect((error as HumanmarkNetworkError).message).toBe(
        'No internet connection'
      );
      expect((error as HumanmarkNetworkError).errorCategory).toBe('temporary');

      // Restore navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });
  });

  describe('Retry behavior with mixed errors', () => {
    it('should retry temporary errors but stop on permanent error', async () => {
      // Arrange
      const temporaryError = new HumanmarkNetworkError(
        'Network timeout',
        ErrorCode.TIMEOUT,
        undefined,
        { errorCategory: 'temporary' }
      );
      const permanentError = new HumanmarkNetworkError(
        'Certificate invalid',
        ErrorCode.NETWORK_ERROR,
        undefined,
        { errorCategory: 'permanent' }
      );

      // First call: temporary error (will retry)
      // Second call: temporary error (will retry)
      // Third call: permanent error (will not retry)
      mockFetch
        .mockRejectedValueOnce(temporaryError)
        .mockRejectedValueOnce(temporaryError)
        .mockRejectedValueOnce(permanentError);

      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'mixed-errors',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });

      // Act
      const promise = apiClient
        .waitForChallengeToken(token, { 'hm-api-key': 'test-key' })
        .catch((err: unknown) => err);

      await vi.runAllTimersAsync();

      const error = await promise;

      // Assert
      expect(error).toBe(permanentError);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 2 retries then stop
    });
  });
});
