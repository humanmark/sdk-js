import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../../core/ApiClient';
import { HumanmarkNetworkError } from '../../errors/HumanmarkError';
import {
  setupTestSuite,
  createMockErrorResponse,
  createMockToken,
} from '../utils/test-helpers';

describe('ApiClient Edge Cases', () => {
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

  describe('calculateRemainingTime edge cases', () => {
    it('should throw timeout error when no time remaining', async () => {
      // Arrange
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'testChallenge123',
        exp: Math.floor((Date.now() + 300000) / 1000), // 5 minutes from now
      });

      // Mock server errors to trigger retries
      mockFetch.mockResolvedValue(createMockErrorResponse(500));

      // Start the request and immediately set up error handling
      const promise = apiClient
        .waitForChallengeToken(token, waitHeaders)
        .catch((error: unknown) => error);

      // Run all timers to trigger timeout
      await vi.runAllTimersAsync();

      // Wait for the error to be caught
      const error = await promise;

      // Assert
      expect(error).toBeInstanceOf(HumanmarkNetworkError);
      expect((error as HumanmarkNetworkError).message).toBe(
        'Client request timed out'
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle AbortError as timeout', async () => {
      // Arrange
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'testChallenge123',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });

      // Mock fetch to throw AbortError
      const abortError = new DOMException(
        'The operation was aborted',
        'AbortError'
      );
      mockFetch.mockRejectedValueOnce(abortError);

      // Act & Assert
      await expect(
        apiClient.waitForChallengeToken(token, waitHeaders)
      ).rejects.toThrow('Network error occurred');
    });

    it('should handle cancelPendingRequests', () => {
      // Act & Assert - should not throw
      expect(() => apiClient.cancelPendingRequests()).not.toThrow();
    });

    it('should handle multiple cancelPendingRequests calls', () => {
      // Act & Assert - should not throw
      expect(() => {
        apiClient.cancelPendingRequests();
        apiClient.cancelPendingRequests();
        apiClient.cancelPendingRequests();
      }).not.toThrow();
    });
  });

  describe('retry timing edge cases', () => {
    it('should handle edge case where retry delay calculation takes time', async () => {
      // Arrange
      const waitHeaders = { 'hm-api-key': 'test-key' };
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'testChallenge123',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });

      // First call returns 408 (timeout), second succeeds
      mockFetch
        .mockResolvedValueOnce(createMockErrorResponse(408))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ receipt: 'test-receipt' }),
        } as Response);

      // Act
      const promise = apiClient.waitForChallengeToken(token, waitHeaders);

      // Advance timers to handle retry
      await vi.runAllTimersAsync();

      const result = await promise;

      // Assert
      expect(result.receipt).toBe('test-receipt');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
