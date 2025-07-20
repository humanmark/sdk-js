import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../../core/ApiClient';
import {
  setupTestSuite,
  createMockResponse,
  createMockErrorResponse,
  createMockToken,
} from '../utils/test-helpers';
import { testData } from '../utils/test-data-builders';
import type {
  CreateChallengeRequest,
  CreateChallengeHeaders,
  WaitChallengeHeaders,
} from '../../types/api';

describe('ApiClient', () => {
  const { mockFetch } = setupTestSuite();
  let apiClient: ApiClient;
  const mockBaseUrl = 'https://api.example.com';

  // Common test data
  const createRequest: CreateChallengeRequest = { domain: 'test.example.com' };
  const createHeaders: CreateChallengeHeaders = {
    'hm-api-key': 'test-api-key',
    'hm-api-secret': 'test-api-secret',
  };
  const waitHeaders: WaitChallengeHeaders = {
    'hm-api-key': 'test-api-key',
  };

  beforeEach(() => {
    apiClient = new ApiClient(mockBaseUrl);
  });

  describe('createChallenge', () => {
    describe('retry behavior', () => {
      it('should retry on 5xx errors and eventually succeed', async () => {
        // Arrange
        vi.useFakeTimers();
        const challengeResponse = testData.challengeResponse();

        mockFetch
          .mockResolvedValueOnce(createMockErrorResponse(500))
          .mockResolvedValueOnce(createMockErrorResponse(503))
          .mockResolvedValueOnce(createMockResponse(challengeResponse));

        // Act
        const promise = apiClient.createChallenge(createRequest, createHeaders);

        // Fast-forward through all timers
        await vi.runAllTimersAsync();

        const result = await promise;

        // Assert
        expect(result).toEqual(challengeResponse);
        expect(mockFetch).toHaveBeenCalledTimes(3);
        vi.useRealTimers();
      });

      it('should retry on 429 rate limit errors', async () => {
        // Arrange
        const challengeResponse = testData.challengeResponse();

        mockFetch
          .mockResolvedValueOnce(createMockErrorResponse(429))
          .mockResolvedValueOnce(createMockResponse(challengeResponse));

        // Act
        const result = await apiClient.createChallenge(
          createRequest,
          createHeaders
        );

        // Assert
        expect(result).toEqual(challengeResponse);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('should not retry on 4xx errors (except 429)', async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce(createMockErrorResponse(400));

        // Act & Assert
        await expect(
          apiClient.createChallenge(createRequest, createHeaders)
        ).rejects.toThrow('HTTP 400: Bad Request');

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should retry on network errors', async () => {
        // Arrange
        const challengeResponse = testData.challengeResponse();

        mockFetch
          .mockRejectedValueOnce(new TypeError('Failed to fetch'))
          .mockResolvedValueOnce(createMockResponse(challengeResponse));

        // Act
        const result = await apiClient.createChallenge(
          createRequest,
          createHeaders
        );

        // Assert
        expect(result).toEqual(challengeResponse);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('should fail after max retries', async () => {
        // Arrange
        vi.useFakeTimers();
        mockFetch.mockResolvedValue(createMockErrorResponse(500));

        // Act - set up promise with rejection handler immediately
        const promise = apiClient.createChallenge(createRequest, createHeaders);
        const rejectionPromise = expect(promise).rejects.toThrow(
          'Client request timed out'
        );

        // Fast-forward through all timers to trigger timeout
        await vi.runAllTimersAsync();

        // Assert
        await rejectionPromise;

        // With exponential backoff, we won't reach all 20 retries before timeout
        // The exact number depends on retry timing, but it should be more than 1
        expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(5);

        vi.useRealTimers();
      });
    });

    describe('error handling', () => {
      it('should handle invalid JSON responses', async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.reject(new Error('Invalid JSON')),
        } as Response);

        // Act & Assert
        await expect(
          apiClient.createChallenge(createRequest, createHeaders)
        ).rejects.toThrow('Invalid JSON response from server');
      });

      it('should pass through non-retryable errors', async () => {
        // Arrange
        mockFetch.mockRejectedValueOnce(new Error('Custom error'));

        // Act & Assert
        await expect(
          apiClient.createChallenge(createRequest, createHeaders)
        ).rejects.toThrow('Custom error');

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('waitForChallengeToken', () => {
    const token = createMockToken({
      shard: 'us-east-1',
      challenge: 'testChallenge123',
    });

    it('should use shard-based URL from token', async () => {
      // Arrange
      const waitResponse = testData.waitResponse();
      mockFetch.mockResolvedValueOnce(createMockResponse(waitResponse));

      // Act
      await apiClient.waitForChallengeToken(token, waitHeaders);

      // Assert - Verify it calls the shard-based URL with extracted challenge ID
      expect(mockFetch).toHaveBeenCalledWith(
        'https://us-east-1.api.example.com/api/v1/challenge/wait/testChallenge123',
        expect.any(Object)
      );
    });

    it('should retry on 408 timeout status', async () => {
      // Arrange
      const waitResponse = testData.waitResponse();
      mockFetch
        .mockResolvedValueOnce(createMockErrorResponse(408))
        .mockResolvedValueOnce(createMockResponse(waitResponse));

      // Act
      const result = await apiClient.waitForChallengeToken(token, waitHeaders);

      // Assert
      expect(result).toEqual(waitResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying on 410 gone status', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(createMockErrorResponse(410));

      // Act & Assert
      await expect(
        apiClient.waitForChallengeToken(token, waitHeaders)
      ).rejects.toThrow('Challenge expired');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid JSON responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      // Act & Assert
      await expect(
        apiClient.waitForChallengeToken(token, waitHeaders)
      ).rejects.toThrow('Invalid JSON response from server');
    });
  });
});
