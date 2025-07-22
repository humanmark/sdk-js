import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../../core/ApiClient';
import {
  setupTestSuite,
  createMockResponse,
  createMockErrorResponse,
  createMockToken,
} from '../utils/test-helpers';
import { testData } from '../utils/test-data-builders';
import type { WaitChallengeHeaders } from '../../types/api';

describe('ApiClient', () => {
  const { mockFetch } = setupTestSuite();
  let apiClient: ApiClient;
  const mockBaseUrl = 'https://api.example.com';

  // Common test data
  const waitHeaders: WaitChallengeHeaders = {
    'hm-api-key': 'test-api-key',
  };

  beforeEach(() => {
    apiClient = new ApiClient(mockBaseUrl);
  });

  describe('waitForChallengeToken', () => {
    describe('retry behavior', () => {
      it('should retry on 5xx errors and eventually succeed', async () => {
        // Arrange
        vi.useFakeTimers();
        const waitResponse = testData.waitResponse();
        const token = createMockToken({
          shard: 'us-east-1',
          challenge: 'test-challenge',
          exp: Math.floor((Date.now() + 300000) / 1000), // 5 minutes from now
        });

        mockFetch
          .mockResolvedValueOnce(createMockErrorResponse(500))
          .mockResolvedValueOnce(createMockErrorResponse(503))
          .mockResolvedValueOnce(createMockResponse(waitResponse));

        // Act
        const promise = apiClient.waitForChallengeToken(token, waitHeaders);

        // Fast-forward through all timers
        await vi.runAllTimersAsync();

        const result = await promise;

        // Assert
        expect(result).toEqual(waitResponse);
        expect(mockFetch).toHaveBeenCalledTimes(3);
        vi.useRealTimers();
      });

      it('should retry on 429 rate limit errors', async () => {
        // Arrange
        vi.useFakeTimers();
        const waitResponse = testData.waitResponse();
        const token = createMockToken({
          shard: 'us-east-1',
          challenge: 'test-challenge',
          exp: Math.floor((Date.now() + 300000) / 1000),
        });

        mockFetch
          .mockResolvedValueOnce(createMockErrorResponse(429))
          .mockResolvedValueOnce(createMockResponse(waitResponse));

        // Act
        const promise = apiClient.waitForChallengeToken(token, waitHeaders);

        // Fast-forward through retry delay
        await vi.runAllTimersAsync();

        const result = await promise;

        // Assert
        expect(result).toEqual(waitResponse);
        expect(mockFetch).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
      });

      it('should not retry on 4xx errors (except 429)', async () => {
        // Arrange
        const token = createMockToken({
          shard: 'us-east-1',
          challenge: 'test-challenge',
          exp: Math.floor((Date.now() + 300000) / 1000),
        });
        mockFetch.mockResolvedValueOnce(createMockErrorResponse(400));

        // Act & Assert
        await expect(
          apiClient.waitForChallengeToken(token, waitHeaders)
        ).rejects.toThrow('HTTP 400: Bad Request');

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should retry on network errors', async () => {
        // Arrange
        vi.useFakeTimers();
        const waitResponse = testData.waitResponse();
        const token = createMockToken({
          shard: 'us-east-1',
          challenge: 'test-challenge',
          exp: Math.floor((Date.now() + 300000) / 1000),
        });

        mockFetch
          .mockRejectedValueOnce(new TypeError('Failed to fetch'))
          .mockResolvedValueOnce(createMockResponse(waitResponse));

        // Act
        const promise = apiClient.waitForChallengeToken(token, waitHeaders);

        // Fast-forward through retry delay
        await vi.runAllTimersAsync();

        const result = await promise;

        // Assert
        expect(result).toEqual(waitResponse);
        expect(mockFetch).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
      });

      it('should fail after max retries', async () => {
        // Arrange
        vi.useFakeTimers();
        const token = createMockToken({
          shard: 'us-east-1',
          challenge: 'test-challenge',
          exp: Math.floor((Date.now() + 300000) / 1000),
        });
        mockFetch.mockResolvedValue(createMockErrorResponse(500));

        // Act - set up promise with rejection handler immediately
        const promise = apiClient.waitForChallengeToken(token, waitHeaders);
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
        const token = createMockToken({
          shard: 'us-east-1',
          challenge: 'test-challenge',
          exp: Math.floor((Date.now() + 300000) / 1000),
        });
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

      it('should handle empty responses', async () => {
        // Arrange
        const token = createMockToken({
          shard: 'us-east-1',
          challenge: 'test-challenge',
          exp: Math.floor((Date.now() + 300000) / 1000),
        });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () =>
            Promise.reject(new SyntaxError('Unexpected end of JSON input')),
        } as Response);

        // Act & Assert
        await expect(
          apiClient.waitForChallengeToken(token, waitHeaders)
        ).rejects.toThrow('Invalid JSON response from server');
      });
    });

    describe('cancelPendingRequests', () => {
      it('should cancel ongoing requests', async () => {
        // Arrange
        const token = createMockToken({
          shard: 'us-east-1',
          challenge: 'test-challenge',
          exp: Math.floor((Date.now() + 300000) / 1000),
        });
        mockFetch.mockImplementationOnce(
          () =>
            new Promise<Response>((_, reject) => {
              setTimeout(() => reject(new DOMException('Aborted')), 100);
            })
        );

        // Act
        const promise = apiClient.waitForChallengeToken(token, waitHeaders);
        apiClient.cancelPendingRequests();

        // Assert
        await expect(promise).rejects.toThrow();
      });
    });

    describe('regional routing', () => {
      it('should route to correct regional endpoint', async () => {
        // Arrange
        const waitResponse = testData.waitResponse();
        const token = createMockToken({
          shard: 'eu-west-1',
          challenge: 'test-challenge',
          exp: Math.floor((Date.now() + 300000) / 1000),
        });

        mockFetch.mockResolvedValueOnce(createMockResponse(waitResponse));

        // Act
        await apiClient.waitForChallengeToken(token, waitHeaders);

        // Assert
        expect(mockFetch).toHaveBeenCalledWith(
          'https://eu-west-1.api.example.com/api/v1/challenge/wait/test-challenge',
          expect.any(Object)
        );
      });
    });
  });
});
