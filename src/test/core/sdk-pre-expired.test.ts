import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HumanmarkSdk } from '../../core/HumanmarkSdk';
import { setupTestSuite, createMockToken } from '../utils/test-helpers';
import { HumanmarkConfigBuilder } from '../utils/test-data-builders';

// Mock QRCode module
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  },
}));

describe('HumanmarkSdk - Pre-expired and Pre-aborted Edge Cases', () => {
  const { mockFetch } = setupTestSuite();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Pre-expired challenges', () => {
    it('should throw no active challenge error when token is already expired before API call', async () => {
      // Arrange - create a token that will expire in 1 second
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'expiredChallenge123',
        exp: Math.floor((Date.now() + 1000) / 1000), // 1 second from now
      });

      const config = new HumanmarkConfigBuilder()
        .withApiKey('test-api-key')
        .withChallengeToken(token)
        .build();

      const sdk = new HumanmarkSdk(config);

      // Advance time to make the token expired
      vi.advanceTimersByTime(2000); // 2 seconds

      // Act & Assert - getCurrentToken() returns null for expired tokens
      await expect(sdk.verify()).rejects.toThrow(
        'No active challenge available'
      );

      // Verify no API calls were made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw no active challenge error immediately when token exp is in the past', async () => {
      // Arrange - create a token that's already expired
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'alreadyExpired456',
        exp: Math.floor((Date.now() - 60000) / 1000), // 1 minute ago
      });

      const config = new HumanmarkConfigBuilder()
        .withApiKey('test-api-key')
        .withChallengeToken(token)
        .build();

      const sdk = new HumanmarkSdk(config);

      // Act & Assert - getCurrentToken() returns null for expired tokens
      await expect(sdk.verify()).rejects.toThrow(
        'No active challenge available'
      );

      // Verify no API calls were made
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Pre-aborted operations', () => {
    it('should throw no active challenge after synchronous cleanup', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'validChallenge789',
        exp: Math.floor((Date.now() + 300000) / 1000), // 5 minutes from now
      });

      const config = new HumanmarkConfigBuilder()
        .withApiKey('test-api-key')
        .withChallengeToken(token)
        .build();

      const sdk = new HumanmarkSdk(config);

      // Start verification
      const verifyPromise = sdk.verify();

      // Immediately cleanup - this clears the token
      sdk.cleanup(true);

      // The verification will fail because cleanup cleared the token
      const error = await verifyPromise.catch((err: unknown) => err);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('No active challenge');
    });

    it('should handle rapid verify and cleanup calls', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'rapidTest123',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });

      const config = new HumanmarkConfigBuilder()
        .withApiKey('test-api-key')
        .withChallengeToken(token)
        .build();

      const sdk = new HumanmarkSdk(config);

      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ receipt: 'test-receipt' }),
      });

      // Act - start verify
      const verifyPromise = sdk.verify();

      // Immediately cleanup (before modal is shown)
      sdk.cleanup();

      // Assert - after cleanup, verify should still try to work but fail because token is cleared
      await expect(verifyPromise).rejects.toThrow(
        'No active challenge available'
      );

      // Verify no API calls were made (because token was cleared before we got to the API call)
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
