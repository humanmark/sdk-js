import { describe, it, expect, vi } from 'vitest';
import { HumanmarkSdk } from '../../core/HumanmarkSdk';
import { HumanmarkVerificationCancelledError } from '../../errors';
import {
  setupTestSuite,
  createMockResponse,
  waitForModal,
} from '../utils/test-helpers';
import { testData } from '../utils/test-data-builders';

// Mock QRCode module
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  },
}));

describe('Modal Cancellation Behavior', () => {
  const { mockFetch } = setupTestSuite();

  it('should throw HumanmarkVerificationCancelledError when modal is closed via X button', async () => {
    // Arrange
    const challengeResponse = testData.challengeResponse();
    const config = testData.createAndVerifyConfig();

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

    const sdk = new HumanmarkSdk(config);

    // Act
    const verifyPromise = sdk.verify();
    const expectRejection = expect(verifyPromise).rejects.toThrow(
      HumanmarkVerificationCancelledError
    );

    const modal = await waitForModal();
    expect(modal).toBeTruthy();

    const closeButton = modal?.querySelector(
      '.humanmark-modal-close'
    ) as HTMLButtonElement;
    expect(closeButton).toBeTruthy();
    closeButton.click();

    // Assert
    await expectRejection;
  });

  it('should throw HumanmarkVerificationCancelledError when modal is closed via ESC key', async () => {
    // Arrange
    const challengeResponse = testData.challengeResponse();
    const config = testData.createAndVerifyConfig();

    mockFetch
      .mockResolvedValueOnce(createMockResponse(challengeResponse))
      .mockReturnValueOnce(
        new Promise(resolve => {
          setTimeout(() => {
            resolve(createMockResponse(testData.waitResponse()));
          }, 10000);
        })
      );

    const sdk = new HumanmarkSdk(config);

    // Act
    const verifyPromise = sdk.verify();
    const expectRejection = expect(verifyPromise).rejects.toThrow(
      HumanmarkVerificationCancelledError
    );

    const modal = await waitForModal();
    expect(modal).toBeTruthy();

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escEvent);

    // Assert
    await expectRejection;
  });

  it('should throw HumanmarkVerificationCancelledError when modal is closed via backdrop click', async () => {
    // Arrange
    const challengeResponse = testData.challengeResponse();
    const config = testData.createAndVerifyConfig();

    mockFetch
      .mockResolvedValueOnce(createMockResponse(challengeResponse))
      .mockReturnValueOnce(
        new Promise(resolve => {
          setTimeout(() => {
            resolve(createMockResponse(testData.waitResponse()));
          }, 10000);
        })
      );

    const sdk = new HumanmarkSdk(config);

    // Act
    const verifyPromise = sdk.verify();
    const expectRejection = expect(verifyPromise).rejects.toThrow(
      HumanmarkVerificationCancelledError
    );

    const modal = await waitForModal();
    expect(modal).toBeTruthy();

    // Simulate click on the overlay itself (not the content)
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    // Set the target to be the modal itself (backdrop)
    Object.defineProperty(clickEvent, 'target', {
      value: modal,
      enumerable: true,
    });
    modal?.dispatchEvent(clickEvent);

    // Assert
    await expectRejection;
  });

  it('should clean up properly after modal cancellation', async () => {
    // Arrange
    const challengeResponse = testData.challengeResponse();
    const config = testData.createAndVerifyConfig();

    mockFetch
      .mockResolvedValueOnce(createMockResponse(challengeResponse))
      .mockReturnValueOnce(
        new Promise(resolve => {
          setTimeout(() => {
            resolve(createMockResponse(testData.waitResponse()));
          }, 10000);
        })
      );

    const sdk = new HumanmarkSdk(config);

    // Act
    const verifyPromise = sdk.verify().catch((error: Error) => {
      // We expect this to throw, just capture it
      return error;
    });

    const modal = await waitForModal();

    const closeButton = modal?.querySelector(
      '.humanmark-modal-close'
    ) as HTMLButtonElement;
    closeButton?.click();

    // Assert
    const error = await verifyPromise;
    expect(error).toBeInstanceOf(HumanmarkVerificationCancelledError);

    // Verify cleanup - modal has a closing animation when cancelled by user
    // The SDK intentionally uses animation for user-initiated cancellations
    // to provide visual feedback. We need to wait for the animation to complete.
    await new Promise(resolve => setTimeout(resolve, 350));
    expect(document.getElementById('humanmark-verification-modal')).toBeFalsy();
  });
});
