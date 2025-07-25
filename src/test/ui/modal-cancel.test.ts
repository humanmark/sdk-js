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
    const config = testData.validConfig();

    mockFetch.mockReturnValueOnce(
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

    // Wait for modal cleanup
    await new Promise(resolve => setTimeout(resolve, 400));

    // Verify body scroll lock is removed after X button cancellation
    expect(document.body.classList.contains('humanmark-modal-open')).toBe(
      false
    );

    // Cleanup
    sdk.cleanup();
  });

  it('should throw HumanmarkVerificationCancelledError when modal is closed via ESC key', async () => {
    // Arrange
    const config = testData.validConfig();

    mockFetch.mockReturnValueOnce(
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

    // Wait for modal cleanup
    await new Promise(resolve => setTimeout(resolve, 400));

    // Verify body scroll lock is removed after ESC key cancellation
    expect(document.body.classList.contains('humanmark-modal-open')).toBe(
      false
    );

    // Cleanup
    sdk.cleanup();
  });

  it('should throw HumanmarkVerificationCancelledError when modal is closed via backdrop click', async () => {
    // Arrange
    const config = testData.validConfig();

    mockFetch.mockReturnValueOnce(
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

    // The modal itself is the overlay/backdrop
    const backdrop = modal as HTMLElement;
    expect(backdrop).toBeTruthy();
    expect(backdrop.classList.contains('humanmark-modal-overlay')).toBe(true);

    // Simulate backdrop click
    const event = new MouseEvent('click', { bubbles: true });
    backdrop.dispatchEvent(event);

    // Assert
    await expectRejection;

    // Wait for modal cleanup
    await new Promise(resolve => setTimeout(resolve, 400));

    // Verify body scroll lock is removed after backdrop click cancellation
    expect(document.body.classList.contains('humanmark-modal-open')).toBe(
      false
    );

    // Cleanup
    sdk.cleanup();
  });

  it('should NOT close modal when clicking on modal content', async () => {
    // Arrange
    const config = testData.validConfig();

    // Mock a response that resolves after test completes
    let resolvePromise: ((value: Response) => void) | undefined;
    mockFetch.mockReturnValueOnce(
      new Promise(resolve => {
        resolvePromise = resolve;
      })
    );

    const sdk = new HumanmarkSdk(config);

    // Act
    const verifyPromise = sdk.verify();

    const modal = await waitForModal();
    expect(modal).toBeTruthy();

    // Find the modal content element
    const modalContent = modal?.querySelector(
      '.humanmark-modal-content'
    ) as HTMLElement;
    expect(modalContent).toBeTruthy();

    // Simulate click on modal content
    const event = new MouseEvent('click', { bubbles: true });
    modalContent.dispatchEvent(event);

    // Wait a bit to ensure no cancellation happens
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert - modal should still be present
    const modalStillExists = document.getElementById(
      'humanmark-verification-modal'
    );
    expect(modalStillExists).not.toBeNull();

    // Cleanup and resolve the promise
    if (resolvePromise) {
      resolvePromise(createMockResponse(testData.waitResponse()));
    }

    // Verify we can get a successful result (not cancelled)
    const result = await verifyPromise;
    expect(result).toBe('verification-receipt-456');
  });

  it('should clean up properly after modal cancellation', async () => {
    // Arrange
    const config = testData.validConfig();

    mockFetch.mockReturnValueOnce(
      new Promise(resolve => {
        setTimeout(() => {
          resolve(createMockResponse(testData.waitResponse()));
        }, 10000);
      })
    );

    const sdk = new HumanmarkSdk(config);

    // Act
    const verifyPromise = sdk.verify();

    const modal = await waitForModal();
    expect(modal).toBeTruthy();

    const closeButton = modal?.querySelector(
      '.humanmark-modal-close'
    ) as HTMLButtonElement;
    closeButton.click();

    // Wait for cancellation
    await expect(verifyPromise).rejects.toThrow(
      HumanmarkVerificationCancelledError
    );

    // Wait for cleanup animation
    await new Promise(resolve => setTimeout(resolve, 400));

    // Assert
    const cleanedModal = document.getElementById(
      'humanmark-verification-modal'
    );
    expect(cleanedModal).toBeNull();

    // Verify body scroll lock is removed
    expect(document.body.classList.contains('humanmark-modal-open')).toBe(
      false
    );
  });

  it('should restore body state after modal cancellation', async () => {
    // Arrange
    const config = testData.validConfig();

    // Set initial body state
    document.body.style.paddingRight = '10px';
    document.body.className = 'custom-class another-class';

    mockFetch.mockReturnValueOnce(
      new Promise(resolve => {
        setTimeout(() => {
          resolve(createMockResponse(testData.waitResponse()));
        }, 10000);
      })
    );

    const sdk = new HumanmarkSdk(config);

    // Act
    const verifyPromise = sdk.verify();

    const modal = await waitForModal();
    expect(modal).toBeTruthy();

    // Verify modal added its class
    expect(document.body.classList.contains('humanmark-modal-open')).toBe(true);
    // But original classes should still be there
    expect(document.body.classList.contains('custom-class')).toBe(true);
    expect(document.body.classList.contains('another-class')).toBe(true);

    // Cancel via X button
    const closeButton = modal?.querySelector(
      '.humanmark-modal-close'
    ) as HTMLButtonElement;
    closeButton.click();

    // Wait for cancellation
    await expect(verifyPromise).rejects.toThrow(
      HumanmarkVerificationCancelledError
    );

    // Wait for cleanup animation
    await new Promise(resolve => setTimeout(resolve, 400));

    // Assert - original body state should be restored
    expect(document.body.classList.contains('humanmark-modal-open')).toBe(
      false
    );
    expect(document.body.classList.contains('custom-class')).toBe(true);
    expect(document.body.classList.contains('another-class')).toBe(true);

    // Note: padding restoration is tested in the scrollbar unit tests
    // Here we just verify the class management doesn't interfere with existing classes

    // Cleanup
    sdk.cleanup();
  });
});
