import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HumanmarkSdk } from '../../core/HumanmarkSdk';
import {
  setupTestSuite,
  createMockResponse,
  createMockErrorResponse,
  expectApiCall,
  mockUserAgent,
  createMockToken,
} from '../utils/test-helpers';
import { testData, HumanmarkConfigBuilder } from '../utils/test-data-builders';

// Mock QRCode module
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-qr-code'),
  },
}));

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
});

describe('HumanmarkSdk', () => {
  const { mockFetch } = setupTestSuite();

  // Set default user agent for tests
  beforeEach(() => {
    mockUserAgent('desktop');
  });

  describe('constructor', () => {
    it('validates configuration on instantiation', () => {
      // Arrange
      const validConfig = testData.validConfig();

      // Act & Assert
      expect(() => new HumanmarkSdk(validConfig)).not.toThrow();
    });

    it('throws when API key is missing', () => {
      // Arrange
      const invalidConfig = {
        apiKey: '',
        challengeToken: 'test-token',
      };

      // Act & Assert
      expect(() => new HumanmarkSdk(invalidConfig)).toThrow(
        'API key is required'
      );
    });

    it('throws when API key is not a string', () => {
      // Arrange
      const invalidConfig = {
        apiKey: 123 as unknown as string,
        challengeToken: 'test-token',
      };

      // Act & Assert
      expect(() => new HumanmarkSdk(invalidConfig)).toThrow(
        'API key is required and must be a string'
      );
    });

    it('throws when challenge token is missing', () => {
      // Arrange
      const invalidConfig = new HumanmarkConfigBuilder()
        .withApiKey('test-key')
        .withChallengeToken('')
        .build();

      // Act & Assert
      expect(() => new HumanmarkSdk(invalidConfig)).toThrow(
        'Challenge token is required and must be a string'
      );
    });
  });

  describe('verify()', () => {
    it('uses existing challenge token and returns receipt', async () => {
      // Arrange
      const existingToken = createMockToken({
        shard: 'us-east-1',
        challenge: 'existingChallenge456',
        exp: Math.floor((Date.now() + 300000) / 1000), // 5 minutes from now
      });
      const waitResponse = testData.waitResponse();
      const config = new HumanmarkConfigBuilder()
        .withApiKey('test-api-key')
        .withChallengeToken(existingToken)
        .build();

      // Mock wait API response
      mockFetch.mockResolvedValueOnce(createMockResponse(waitResponse));

      // Act
      const sdk = new HumanmarkSdk(config);
      const receipt = await sdk.verify();

      // Assert
      expect(receipt).toBe(waitResponse.receipt);

      // Should only call wait endpoint
      expectApiCall(
        mockFetch,
        1,
        `https://us-east-1.humanmark.io/api/v1/challenge/wait/existingChallenge456`,
        {
          method: 'GET',
          headers: expect.objectContaining({
            'hm-api-key': config.apiKey,
          }) as Record<string, string>,
        }
      );
    });

    it('handles expired challenges appropriately', async () => {
      // Arrange
      const expiredToken = createMockToken({
        shard: 'us-east-1',
        challenge: 'expiredChallenge789',
        exp: Math.floor((Date.now() + 60000) / 1000), // Still valid for API call
      });
      const config = new HumanmarkConfigBuilder()
        .withApiKey('test-api-key')
        .withChallengeToken(expiredToken)
        .build();
      const goneResponse = createMockErrorResponse(410);

      mockFetch.mockResolvedValueOnce(goneResponse);

      // Act
      const sdk = new HumanmarkSdk(config);
      const verifyPromise = sdk.verify();

      // Assert
      await expect(verifyPromise).rejects.toThrow('Challenge expired');
    });

    it('handles API errors with proper error messages', async () => {
      // Arrange
      const errorResponse = createMockErrorResponse(401);
      const config = testData.validConfig();

      mockFetch.mockResolvedValueOnce(errorResponse);

      // Act
      const sdk = new HumanmarkSdk(config);
      const verifyPromise = sdk.verify();

      // Assert
      await expect(verifyPromise).rejects.toThrow('HTTP 401: Unauthorized');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('handles network errors properly', async () => {
      // Arrange
      vi.useFakeTimers();
      const config = testData.validConfig();

      // Always reject with network error
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      // Act
      const sdk = new HumanmarkSdk(config);

      // Start verification and immediately handle rejection
      const verifyPromise = sdk.verify().catch((err: unknown) => err);

      // Run timers to trigger timeout
      await vi.runAllTimersAsync();

      // Assert
      const error = await verifyPromise;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Client request timed out');
      expect(mockFetch.mock.calls.length).toBeGreaterThan(1); // Should retry multiple times

      // Cleanup
      sdk.cleanup();
      vi.useRealTimers();
    });
  });

  describe('device detection', () => {
    it('detects desktop browsers correctly', async () => {
      // Arrange
      mockUserAgent('desktop');

      // Act
      const { shouldShowQRCode, shouldShowDeepLink } = await import(
        '../../utils/device'
      );

      // Assert
      expect(shouldShowQRCode()).toBe(true);
      expect(shouldShowDeepLink()).toBe(false);
    });

    it('detects mobile browsers correctly', async () => {
      // Arrange
      mockUserAgent('mobile');

      // Act
      const { shouldShowQRCode, shouldShowDeepLink } = await import(
        '../../utils/device'
      );

      // Assert
      expect(shouldShowQRCode()).toBe(false);
      expect(shouldShowDeepLink()).toBe(true);
    });
  });

  describe('cleanup()', () => {
    it('removes modal and cancels pending requests', async () => {
      // Arrange
      const config = testData.validConfig();
      const sdk = new HumanmarkSdk(config);

      // Spy on the apiClient's cancelPendingRequests method
      const apiClient = sdk['apiClient'];
      const cancelSpy = vi.spyOn(apiClient, 'cancelPendingRequests');

      // Mock response that doesn't resolve immediately
      let resolveFn: ((value: Response) => void) | undefined;
      mockFetch.mockImplementationOnce(
        () =>
          new Promise<Response>(resolve => {
            resolveFn = resolve;
          })
      );

      // Act
      const verifyPromise = sdk.verify();
      // Wait for modal to be created
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify modal exists before cleanup
      const modalBeforeCleanup = document.getElementById(
        'humanmark-verification-modal'
      );
      expect(modalBeforeCleanup).not.toBeNull();

      sdk.cleanup();

      // Resolve the hanging promise
      if (resolveFn) {
        resolveFn(createMockResponse(testData.waitResponse()));
      }

      // Assert
      await expect(verifyPromise).rejects.toThrow();

      // Verify cancelPendingRequests was called at least once
      expect(cancelSpy).toHaveBeenCalled();

      // Wait for cleanup animation to complete
      await new Promise(resolve => setTimeout(resolve, 400));

      const modal = document.getElementById('humanmark-verification-modal');
      expect(modal).toBeNull();
    });
  });
});
