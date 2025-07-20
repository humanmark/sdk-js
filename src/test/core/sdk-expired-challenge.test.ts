import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HumanmarkSdk } from '../../core/HumanmarkSdk';
import { HumanmarkChallengeError } from '../../errors/HumanmarkError';
import { HumanmarkVerificationCancelledError } from '../../errors/VerificationCancelledError';
import { ErrorCode } from '../../types/errors';
import { createMockToken } from '../utils/test-helpers';
import { setupTestSuite } from '../utils/test-helpers';

// Mock UI module
vi.mock('@/ui', () => ({
  loadUIManager: vi.fn(),
}));

describe('HumanmarkSdk - Expired Challenge Tests', () => {
  setupTestSuite();

  beforeEach(async () => {
    // Set up default mock
    vi.mocked(await import('@/ui')).loadUIManager.mockResolvedValue(
      class MockUIManager {
        showVerificationModal = vi.fn();
        hideModal = vi.fn();
        onModalClosed = vi.fn();
        onSuccess = vi.fn();
        showSuccess = vi.fn();
        cleanup = vi.fn();
      } as unknown as typeof import('../../ui/UIManager').UIManager
    );
  });
  describe('Expired challenge handling', () => {
    it('should throw error when challenge is already expired', async () => {
      // Arrange - Create an expired token
      const expiredToken = createMockToken({
        shard: 'us-east-1',
        challenge: 'expired-challenge',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200, // Issued 2 hours ago
      });

      const sdk = new HumanmarkSdk({
        apiKey: 'test-key',
        challenge: expiredToken,
        domain: 'example.com',
      });

      // Act & Assert
      // The SDK checks token expiration locally before making API calls
      // So it throws HumanmarkChallengeError with NO_ACTIVE_CHALLENGE
      const error = await sdk.verify().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(HumanmarkChallengeError);
      expect(error).toMatchObject({
        code: ErrorCode.NO_ACTIVE_CHALLENGE,
        message: expect.stringContaining('No active challenge') as string,
      });
    });
  });

  describe('Abort signal handling', () => {
    it('should handle user cancellation', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
      });

      // Mock the UI to simulate cancellation
      vi.mocked(await import('@/ui')).loadUIManager.mockResolvedValue(
        class MockUIManager {
          showVerificationModal = vi.fn();
          hideModal = vi.fn();
          onModalClosed = vi.fn((callback: () => void) => {
            // Simulate user cancelling after modal is shown
            setTimeout(() => callback(), 10);
          });
          onSuccess = vi.fn();
          showSuccess = vi.fn();
          cleanup = vi.fn();
        } as unknown as typeof import('../../ui/UIManager').UIManager
      );

      const sdk = new HumanmarkSdk({
        apiKey: 'test-key',
        challenge: token,
        domain: 'example.com',
      });

      // Act & Assert
      await expect(sdk.verify()).rejects.toBeInstanceOf(
        HumanmarkVerificationCancelledError
      );
    });
  });
});
