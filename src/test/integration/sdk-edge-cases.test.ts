import { describe, it, expect, vi } from 'vitest';
import { HumanmarkSdk } from '../../core/HumanmarkSdk';
import { HumanmarkVerificationCancelledError } from '../../errors';
import {
  setupTestSuite,
  createMockResponse,
  waitForModal,
  createMockToken,
} from '../utils/test-helpers';
import { testData } from '../utils/test-data-builders';

// Mock QRCode module
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  },
}));

describe('HumanmarkSdk Edge Cases', () => {
  const { mockFetch } = setupTestSuite();

  describe('waitForVerification edge cases', () => {
    it('should throw cancelled error when modal is closed before verification', async () => {
      // Arrange
      const config = testData.createAndVerifyConfig();
      const sdk = new HumanmarkSdk(config);
      const challengeResponse = testData.challengeResponse();

      // Mock successful challenge creation, but slow wait response
      mockFetch
        .mockResolvedValueOnce(createMockResponse(challengeResponse))
        .mockReturnValueOnce(
          new Promise(resolve => {
            // Never resolves during test
            setTimeout(() => {
              resolve(createMockResponse(testData.waitResponse()));
            }, 10000);
          })
        );

      // Act
      const verifyPromise = sdk.verify();

      // Wait for modal to appear
      await waitForModal();

      // Close the modal to trigger cancellation
      const modal = document.getElementById('humanmark-verification-modal');
      const closeButton = modal?.querySelector(
        '.humanmark-modal-close'
      ) as HTMLButtonElement;
      closeButton?.click();

      // Assert
      await expect(verifyPromise).rejects.toThrow(
        HumanmarkVerificationCancelledError
      );
    });

    it('should throw no token error when wait response has no token', async () => {
      // Arrange
      const config = testData.createAndVerifyConfig();
      const sdk = new HumanmarkSdk(config);
      const challengeResponse = testData.challengeResponse();

      // Mock successful challenge creation
      mockFetch.mockResolvedValueOnce(createMockResponse(challengeResponse));

      // Mock wait response without token
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          // Response with no token field
          status: 'completed',
        })
      );

      // Act & Assert
      await expect(sdk.verify()).rejects.toThrow(
        'No token received from verification'
      );
    });

    it('should handle wait response with expired challenge', async () => {
      // Arrange
      const config = testData.createAndVerifyConfig();
      const sdk = new HumanmarkSdk(config);
      const challengeResponse = testData.challengeResponse();

      // Mock successful challenge creation
      mockFetch.mockResolvedValueOnce(createMockResponse(challengeResponse));

      // Mock wait response with 410 Gone (challenge expired)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 410,
        statusText: 'Gone',
        json: () => Promise.resolve({ error: 'Challenge expired' }),
      } as Response);

      // Act & Assert
      await expect(sdk.verify()).rejects.toThrow('Challenge expired');
    });
  });

  describe('verify-only mode edge cases', () => {
    it('should handle pre-aborted verification in verify-only mode', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'existingChallenge789',
      });
      const config = testData.verifyOnlyConfig(token);
      const sdk = new HumanmarkSdk(config);

      // Create and immediately abort
      const verifyPromise = sdk.verify();

      // Wait for modal
      await waitForModal();

      // Trigger modal close immediately
      const modal = document.getElementById('humanmark-verification-modal');
      const closeButton = modal?.querySelector(
        '.humanmark-modal-close'
      ) as HTMLButtonElement;
      closeButton?.click();

      // Assert
      await expect(verifyPromise).rejects.toThrow(
        HumanmarkVerificationCancelledError
      );
    });
  });

  describe('cleanup edge cases', () => {
    it('should handle cleanup when already cleaned up', () => {
      // Arrange
      const config = testData.createAndVerifyConfig();
      const sdk = new HumanmarkSdk(config);

      // Act - call cleanup multiple times
      sdk.cleanup();
      sdk.cleanup();
      sdk.cleanup();

      // Assert - should not throw
      expect(() => sdk.cleanup()).not.toThrow();
    });

    it('should pass immediate flag through cleanup', () => {
      // Arrange
      const config = testData.createAndVerifyConfig();
      const sdk = new HumanmarkSdk(config);

      // Act & Assert - should not throw
      expect(() => sdk.cleanup(true)).not.toThrow();
      expect(() => sdk.cleanup(false)).not.toThrow();
      expect(() => sdk.cleanup()).not.toThrow();
    });
  });
});
