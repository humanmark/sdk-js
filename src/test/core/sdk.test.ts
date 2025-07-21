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
import {
  testData,
  HumanmarkConfigBuilder,
  ChallengeResponseBuilder,
} from '../utils/test-data-builders';

// Mock QRCode module
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
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
      const validConfig = testData.createAndVerifyConfig();

      // Act & Assert
      expect(() => new HumanmarkSdk(validConfig)).not.toThrow();
    });

    it('throws when API key is missing', () => {
      // Arrange
      const invalidConfig = {
        apiKey: '',
        domain: 'example.com',
      };

      // Act & Assert
      expect(() => new HumanmarkSdk(invalidConfig)).toThrow(
        'API key is required'
      );
    });

    it('throws when domain is not a string', () => {
      // Arrange
      const invalidConfig = {
        apiKey: 'test-key',
        domain: 123 as unknown as string,
      };

      // Act & Assert
      expect(() => new HumanmarkSdk(invalidConfig)).toThrow(
        'Domain must be a string'
      );
    });

    it('throws when neither apiSecret nor challenge is provided', () => {
      // Arrange
      const invalidConfig = new HumanmarkConfigBuilder()
        .withApiKey('test-key')
        .withDomain('example.com')
        .build();

      // Act & Assert
      expect(() => new HumanmarkSdk(invalidConfig)).toThrow(
        'Provide either apiSecret (create & verify mode) or challengeToken (verify-only mode)'
      );
    });
  });

  describe('verify()', () => {
    describe('when in create & verify mode', () => {
      it('creates challenge and returns verification token', async () => {
        // Arrange
        const challengeResponse = new ChallengeResponseBuilder()
          .withShard('us-east-1')
          .withChallenge('testChallenge123')
          .build();
        const waitResponse = testData.waitResponse();
        const config = testData.createAndVerifyConfig();

        mockFetch
          .mockResolvedValueOnce(createMockResponse(challengeResponse))
          .mockResolvedValueOnce(createMockResponse(waitResponse));

        // Act
        const sdk = new HumanmarkSdk(config);
        const token = await sdk.verify();

        // Assert
        expect(token).toBe(waitResponse.token);
        expect(mockFetch).toHaveBeenCalledTimes(2);

        // Verify create challenge call
        expectApiCall(
          mockFetch,
          1,
          'https://humanmark.io/api/v1/challenge/create',
          {
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'hm-api-key': config.apiKey,
              'hm-api-secret': config.apiSecret,
            }) as Record<string, string>,
            body: JSON.stringify({ domain: config.domain }),
          }
        );

        // Verify wait challenge call
        expectApiCall(
          mockFetch,
          2,
          `https://us-east-1.humanmark.io/api/v1/challenge/wait/testChallenge123`,
          {
            method: 'GET',
            headers: expect.objectContaining({
              'hm-api-key': config.apiKey,
            }) as Record<string, string>,
          }
        );
      });

      it('handles API errors with proper error messages', async () => {
        // Arrange
        const errorResponse = createMockErrorResponse(401);
        const config = testData.createAndVerifyConfig();

        mockFetch.mockResolvedValueOnce(errorResponse);

        // Act
        const sdk = new HumanmarkSdk(config);
        const verifyPromise = sdk.verify();

        // Assert
        await expect(verifyPromise).rejects.toThrow('HTTP 401: Unauthorized');
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('retries on network errors', async () => {
        // Arrange
        const challengeResponse = testData.challengeResponse();
        const waitResponse = testData.waitResponse();
        const config = testData.createAndVerifyConfig();

        mockFetch
          .mockRejectedValueOnce(new TypeError('Failed to fetch'))
          .mockResolvedValueOnce(createMockResponse(challengeResponse))
          .mockResolvedValueOnce(createMockResponse(waitResponse));

        // Act
        const sdk = new HumanmarkSdk(config);
        const token = await sdk.verify();

        // Assert
        expect(token).toBe(waitResponse.token);
        expect(mockFetch).toHaveBeenCalledTimes(3); // 1 failure + 2 success
      });
    });

    describe('when in verify-only mode', () => {
      it('uses existing challenge token without creating new one', async () => {
        // Arrange
        const existingToken = createMockToken({
          shard: 'us-east-1',
          challenge: 'existingChallenge456',
        });
        const waitResponse = testData.waitResponse();
        const config = testData.verifyOnlyConfig(existingToken);

        // Mock wait API response (called twice - once for modal, once for verification)
        mockFetch
          .mockResolvedValueOnce(createMockResponse(waitResponse))
          .mockResolvedValueOnce(createMockResponse(waitResponse));

        // Act
        const sdk = new HumanmarkSdk(config);
        const token = await sdk.verify();

        // Assert
        expect(token).toBe(waitResponse.token);

        // Should only call wait endpoint, not create
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
        const config = testData.verifyOnlyConfig(expiredToken);
        const goneResponse = createMockErrorResponse(410);

        mockFetch.mockResolvedValueOnce(goneResponse);

        // Act
        const sdk = new HumanmarkSdk(config);
        const verifyPromise = sdk.verify();

        // Assert
        await expect(verifyPromise).rejects.toThrow('Challenge expired');
      });
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
      const config = testData.createAndVerifyConfig();
      const sdk = new HumanmarkSdk(config);
      const challengeResponse = testData.challengeResponse();

      // Mock first response, then block on second
      let resolveFn: ((value: Response) => void) | undefined;
      mockFetch
        .mockResolvedValueOnce(createMockResponse(challengeResponse))
        .mockImplementationOnce(
          () =>
            new Promise<Response>(resolve => {
              resolveFn = resolve;
            })
        );

      // Act
      const verifyPromise = sdk.verify();
      // Wait for modal to be created
      await new Promise(resolve => setTimeout(resolve, 50));

      sdk.cleanup();

      // Resolve the hanging promise
      if (resolveFn) {
        resolveFn(createMockResponse(testData.waitResponse()));
      }

      // Assert
      await expect(verifyPromise).rejects.toThrow();

      // Wait for cleanup animation to complete
      await new Promise(resolve => setTimeout(resolve, 400));

      const modal = document.getElementById('humanmark-verification-modal');
      expect(modal).toBeNull();
    });
  });
});
