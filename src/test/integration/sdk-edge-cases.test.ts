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
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-qr-code'),
  },
}));

describe('HumanmarkSdk Edge Cases', () => {
  const { mockFetch } = setupTestSuite();

  describe('waitForVerification edge cases', () => {
    it('should throw cancelled error when modal is closed before verification', async () => {
      // Arrange
      const config = testData.validConfig();
      const sdk = new HumanmarkSdk(config);

      // Mock slow wait response
      mockFetch.mockReturnValueOnce(
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

      // Cleanup
      sdk.cleanup();
    });

    it('should throw no token error when wait response has no token', async () => {
      // Arrange
      const config = testData.validConfig();
      const sdk = new HumanmarkSdk(config);

      // Mock wait response without receipt
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          // No receipt field
        })
      );

      // Act & Assert
      await expect(sdk.verify()).rejects.toThrow(
        'No receipt received from verification'
      );
    });

    it('should handle wait response with expired challenge', async () => {
      // Arrange
      const config = testData.validConfig();
      const sdk = new HumanmarkSdk(config);

      // Mock 410 Gone response (expired)
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

  describe('edge cases', () => {
    it('should handle pre-aborted verification', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'preAbortChallenge',
        exp: Math.floor((Date.now() + 300000) / 1000), // 5 minutes from now
      });
      const config = {
        apiKey: 'test-key',
        challengeToken: token,
      };
      const sdk = new HumanmarkSdk(config);

      // Mock aborted response
      mockFetch.mockRejectedValueOnce(
        new DOMException('The operation was aborted', 'AbortError')
      );

      // Act & Assert
      await expect(sdk.verify()).rejects.toThrow('Network error occurred');
    });
  });

  describe('cleanup edge cases', () => {
    it('should handle cleanup when already cleaned up', () => {
      // Arrange
      const config = testData.validConfig();
      const sdk = new HumanmarkSdk(config);

      // Act & Assert - should not throw
      expect(() => {
        sdk.cleanup();
        sdk.cleanup(); // Second cleanup
        sdk.cleanup(); // Third cleanup
      }).not.toThrow();
    });

    it('should immediately remove modal when cleanup is called with immediate flag', async () => {
      // Arrange
      const config = testData.validConfig();
      const sdk = new HumanmarkSdk(config);

      // Mock successful response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(testData.waitResponse())
      );

      // Start verification
      await sdk.verify();

      // Verify modal exists before cleanup
      const modalBeforeCleanup = document.getElementById(
        'humanmark-verification-modal'
      );
      expect(modalBeforeCleanup).not.toBeNull();

      // Act - cleanup with immediate flag
      sdk.cleanup(true);

      // Assert - modal should be removed immediately without animation
      // No need to wait for animation when immediate=true
      const modalAfterCleanup = document.getElementById(
        'humanmark-verification-modal'
      );
      expect(modalAfterCleanup).toBeNull();
    });

    it('should handle rapid modal open/close without leaving body locked', async () => {
      // Arrange
      const config = testData.validConfig();

      // Mock responses that never resolve (so we can control timing)
      const neverResolve = new Promise(() => {});
      mockFetch.mockReturnValue(neverResolve);

      // Store initial body state
      const initialBodyClass = document.body.className;

      // Act - rapidly open and close modals
      for (let i = 0; i < 5; i++) {
        const sdk = new HumanmarkSdk(config);

        // Start verification
        const verifyPromise = sdk.verify();

        // Wait for modal
        await waitForModal();

        // Verify body is locked
        expect(document.body.classList.contains('humanmark-modal-open')).toBe(
          true
        );

        // Immediately close it
        const closeButton = document.querySelector(
          '.humanmark-modal-close'
        ) as HTMLButtonElement;
        closeButton?.click();

        // Wait for cancellation
        await expect(verifyPromise).rejects.toThrow(
          HumanmarkVerificationCancelledError
        );

        // Wait for cleanup animation
        await new Promise(resolve => setTimeout(resolve, 400));

        // Verify body is unlocked
        expect(document.body.classList.contains('humanmark-modal-open')).toBe(
          false
        );
      }

      // Assert - body should be in original state after all operations
      expect(document.body.classList.contains('humanmark-modal-open')).toBe(
        false
      );
      expect(document.body.className).toBe(initialBodyClass);
    });
  });
});
