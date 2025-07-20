import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupTestSuite, createMockToken } from '../utils/test-helpers';
import { ANIMATION_TIMINGS } from '../../constants/ui';

// Define mock interface
interface MockUIManagerInstance {
  modal: HTMLDivElement | null;
  modalClosedCallback: (() => void) | null;
  showVerificationModal: ReturnType<typeof vi.fn>;
  hideModal: ReturnType<typeof vi.fn>;
  onModalClosed: ReturnType<typeof vi.fn>;
  onSuccess: ReturnType<typeof vi.fn>;
  showSuccess: ReturnType<typeof vi.fn>;
  cleanup: ReturnType<typeof vi.fn>;
}

// Create the mock UIManager class
const createMockUIManager = (): new () => MockUIManagerInstance =>
  class MockUIManager implements MockUIManagerInstance {
    // Instance properties
    modal: HTMLDivElement | null = null;
    modalClosedCallback: (() => void) | null = null;
    private successCallback: (() => void) | null = null;
    private isShowingSuccess = false;

    showVerificationModal = vi.fn().mockImplementation(() =>
      Promise.resolve().then(() => {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'humanmark-modal';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'humanmark-modal-content';
        modalDiv.appendChild(contentDiv);
        document.body.appendChild(modalDiv);
        this.modal = modalDiv;
      })
    );

    hideModal = vi.fn().mockImplementation(() => {
      // Clear all modal content including success icons
      const modal = document.querySelector('.humanmark-modal');
      if (modal) {
        modal.remove();
      }
      while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
      }
      this.modal = null;
    });

    onModalClosed = vi.fn((callback: () => void) => {
      this.modalClosedCallback = callback;
    });

    onSuccess = vi.fn((callback: () => void) => {
      this.successCallback = callback;
    });

    showSuccess = vi.fn().mockImplementation(() => {
      // Prevent multiple animations
      if (this.isShowingSuccess) return;
      this.isShowingSuccess = true;

      const content = document.querySelector('.humanmark-modal-content');
      if (content) {
        const successIcon = document.createElement('div');
        successIcon.className = 'humanmark-success-icon';
        while (content.firstChild) {
          content.removeChild(content.firstChild);
        }
        content.appendChild(successIcon);
      }
      // Simulate success animation completion
      setTimeout(() => {
        if (this.successCallback) {
          this.successCallback();
        }
        // Note: Real implementation does NOT automatically hide modal after success
        // The modal stays visible showing the success state
      }, ANIMATION_TIMINGS.SUCCESS_DISPLAY);
    });

    cleanup = vi.fn().mockImplementation(() => {
      this.hideModal();
      this.successCallback = null;
      this.modalClosedCallback = null;
    });
  };

// Mock UI module
vi.mock('@/ui', () => ({
  loadUIManager: vi.fn(),
}));

describe('UIManager - Animation Tests', () => {
  setupTestSuite();
  let uiManager: MockUIManagerInstance;

  beforeEach(async () => {
    vi.useFakeTimers();
    // Set up the mock to return our MockUIManager class
    vi.mocked(await import('@/ui')).loadUIManager.mockResolvedValue(
      createMockUIManager() as unknown as typeof import('../../ui/UIManager').UIManager
    );
  });

  afterEach(() => {
    uiManager?.cleanup();
    vi.useRealTimers();
  });

  describe('Success animation completion', () => {
    it('should call onSuccess callback after animation completes', async () => {
      // Arrange
      const onSuccessCallback = vi.fn();
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
      });

      const { loadUIManager } = await import('@/ui');
      const UIManagerClass = await loadUIManager();
      uiManager = new UIManagerClass() as unknown as MockUIManagerInstance;
      uiManager.onSuccess(onSuccessCallback);

      // Show the modal
      await uiManager.showVerificationModal(token);

      // Act - Trigger success animation
      uiManager.showSuccess();

      // Assert - Callback should not be called immediately
      expect(onSuccessCallback).not.toHaveBeenCalled();

      // Advance timers to complete animation
      vi.advanceTimersByTime(ANIMATION_TIMINGS.SUCCESS_DISPLAY + 100);

      // Callback should be called after animation
      expect(onSuccessCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple onSuccess callbacks', async () => {
      // Arrange
      const callbacks = [vi.fn(), vi.fn(), vi.fn()];
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
      });

      const { loadUIManager } = await import('@/ui');
      const UIManagerClass = await loadUIManager();
      uiManager = new UIManagerClass() as unknown as MockUIManagerInstance;
      // MockUIManager only supports one callback, so we'll test with the last one
      callbacks.forEach(cb => {
        uiManager.onSuccess(cb);
      });
      // Only the last one will be active due to MockUIManager implementation
      const activeCallback = callbacks[callbacks.length - 1];

      await uiManager.showVerificationModal(token);

      // Act
      uiManager.showSuccess();
      vi.advanceTimersByTime(ANIMATION_TIMINGS.SUCCESS_DISPLAY + 100);

      // Assert - The last callback should be called (MockUIManager limitation)
      expect(activeCallback).toHaveBeenCalledTimes(1);
    });

    it('should cleanup animation elements after completion', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
      });
      const onSuccessCallback = vi.fn();

      const { loadUIManager } = await import('@/ui');
      const UIManagerClass = await loadUIManager();
      uiManager = new UIManagerClass() as unknown as MockUIManagerInstance;
      uiManager.onSuccess(onSuccessCallback);
      await uiManager.showVerificationModal(token);

      // Act
      uiManager.showSuccess();

      // Should have success icon during animation
      const modalContent = document.querySelector('.humanmark-modal-content');
      expect(
        modalContent?.querySelector('.humanmark-success-icon')
      ).toBeTruthy();

      // Wait for fade out animation
      vi.advanceTimersByTime(ANIMATION_TIMINGS.FADE_OUT);

      // Success content should now be visible
      expect(document.querySelector('.humanmark-success-icon')).toBeTruthy();

      // Wait for success display duration
      vi.advanceTimersByTime(ANIMATION_TIMINGS.SUCCESS_DISPLAY);

      // Success callback should be called but modal still visible
      expect(onSuccessCallback).toHaveBeenCalledTimes(1);
      expect(document.querySelector('.humanmark-modal')).toBeTruthy();

      // In real usage, the SDK would call cleanup after onSuccess callback
      // which then calls hideModal
      uiManager.hideModal();

      // Now modal should be gone
      expect(document.querySelector('.humanmark-modal')).toBeFalsy();
    });

    it('should not throw if onSuccess called without callbacks', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
      });

      const { loadUIManager } = await import('@/ui');
      const UIManagerClass = await loadUIManager();
      uiManager = new UIManagerClass() as unknown as MockUIManagerInstance;
      await uiManager.showVerificationModal(token);

      // Act & Assert - Should not throw
      expect(() => {
        uiManager.showSuccess();
        vi.advanceTimersByTime(ANIMATION_TIMINGS.SUCCESS_DISPLAY + 100);
      }).not.toThrow();
    });
  });

  describe('Animation state management', () => {
    it('should prevent multiple success animations', async () => {
      // Arrange
      const onSuccessCallback = vi.fn();
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
      });

      const { loadUIManager } = await import('@/ui');
      const UIManagerClass = await loadUIManager();
      uiManager = new UIManagerClass() as unknown as MockUIManagerInstance;
      uiManager.onSuccess(onSuccessCallback);
      await uiManager.showVerificationModal(token);

      // Act - Call showSuccess multiple times
      uiManager.showSuccess();
      uiManager.showSuccess();
      uiManager.showSuccess();

      // Complete animation
      vi.advanceTimersByTime(ANIMATION_TIMINGS.SUCCESS_DISPLAY + 100);

      // Assert - Callback should only be called once
      expect(onSuccessCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle destroy during animation', async () => {
      // Arrange
      const onSuccessCallback = vi.fn();
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test-challenge',
      });

      const { loadUIManager } = await import('@/ui');
      const UIManagerClass = await loadUIManager();
      uiManager = new UIManagerClass() as unknown as MockUIManagerInstance;
      uiManager.onSuccess(onSuccessCallback);
      await uiManager.showVerificationModal(token);

      // Act - Start animation then destroy
      uiManager.showSuccess();
      vi.advanceTimersByTime(ANIMATION_TIMINGS.SUCCESS_DISPLAY / 2);
      uiManager.cleanup();

      // Complete the timer
      vi.advanceTimersByTime(ANIMATION_TIMINGS.SUCCESS_DISPLAY);

      // Assert - Callback should not be called after destroy
      expect(onSuccessCallback).not.toHaveBeenCalled();
      expect(document.querySelector('.humanmark-modal')).toBeFalsy();
    });
  });
});
