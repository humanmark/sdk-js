import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibilityManager } from '../../ui/AccessibilityManager';
import {
  CSS_CLASSES,
  KEYBOARD_KEYS,
  ANIMATION_TIMINGS,
} from '../../constants/ui';

describe('AccessibilityManager', () => {
  beforeEach(() => {
    // Clean up any existing elements
    document.body.textContent = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    AccessibilityManager.cleanup();
    vi.useRealTimers();
  });

  describe('announce', () => {
    it('should create announcement element on first use', () => {
      // Act
      AccessibilityManager.announce('Test message');

      // Assert
      const announcement = document.querySelector('[aria-live]');
      expect(announcement).toBeTruthy();
      expect(announcement?.getAttribute('aria-live')).toBe('polite');
      expect(announcement?.getAttribute('aria-atomic')).toBe('true');
      expect(announcement?.className).toBe(
        CSS_CLASSES.ACCESSIBILITY.SCREEN_READER_ONLY
      );
      expect(announcement?.textContent).toBe('Test message');
    });

    it('should reuse existing announcement element', () => {
      // Arrange
      AccessibilityManager.announce('First message');
      const firstElement = document.querySelector('[aria-live]');

      // Act
      AccessibilityManager.announce('Second message');
      const secondElement = document.querySelector('[aria-live]');

      // Assert
      expect(firstElement).toBe(secondElement);
      expect(secondElement?.textContent).toBe('Second message');
    });

    it('should support assertive priority', () => {
      // Act
      AccessibilityManager.announce('Urgent message', 'assertive');

      // Assert
      const announcement = document.querySelector('[aria-live]');
      expect(announcement?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should clear announcement after timeout', () => {
      // Act
      AccessibilityManager.announce('Temporary message');
      const announcement = document.querySelector('[aria-live]');

      // Assert - before timeout
      expect(announcement?.textContent).toBe('Temporary message');

      // Fast forward past timeout
      vi.advanceTimersByTime(ANIMATION_TIMINGS.ANNOUNCEMENT_CLEAR);

      // Assert - after timeout
      expect(announcement?.textContent).toBe('');
    });
  });

  describe('createFocusTrap', () => {
    it('should trap focus between first and last focusable elements', () => {
      // Arrange
      const container = document.createElement('div');

      const firstButton = document.createElement('button');
      firstButton.id = 'first';
      firstButton.textContent = 'First';

      const middleInput = document.createElement('input');
      middleInput.id = 'middle';
      middleInput.type = 'text';

      const lastButton = document.createElement('button');
      lastButton.id = 'last';
      lastButton.textContent = 'Last';

      container.appendChild(firstButton);
      container.appendChild(middleInput);
      container.appendChild(lastButton);
      document.body.appendChild(container);

      // Act
      const cleanup = AccessibilityManager.createFocusTrap(container);
      lastButton.focus();

      // Simulate Tab key when focus is on last element
      const tabEvent = new KeyboardEvent('keydown', {
        key: KEYBOARD_KEYS.TAB,
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });

      // Need to spy on preventDefault since KeyboardEvent constructor doesn't allow it
      let defaultPrevented = false;
      tabEvent.preventDefault = (): void => {
        defaultPrevented = true;
      };

      container.dispatchEvent(tabEvent);

      // Assert
      expect(defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(firstButton);

      // Cleanup
      cleanup();
    });

    it('should handle Shift+Tab to wrap to last element', () => {
      // Arrange
      const container = document.createElement('div');

      const firstBtn = document.createElement('button');
      firstBtn.id = 'first';
      firstBtn.textContent = 'First';

      const lastBtn = document.createElement('button');
      lastBtn.id = 'last';
      lastBtn.textContent = 'Last';

      container.appendChild(firstBtn);
      container.appendChild(lastBtn);
      document.body.appendChild(container);

      // Act
      const cleanup = AccessibilityManager.createFocusTrap(container);
      firstBtn.focus();

      // Simulate Shift+Tab
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: KEYBOARD_KEYS.TAB,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });

      // Need to spy on preventDefault
      let defaultPrevented = false;
      shiftTabEvent.preventDefault = (): void => {
        defaultPrevented = true;
      };

      container.dispatchEvent(shiftTabEvent);

      // Assert
      expect(defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(lastBtn);

      // Cleanup
      cleanup();
    });

    it('should return noop function when no focusable elements', () => {
      // Arrange
      const container = document.createElement('div');
      const p = document.createElement('p');
      p.textContent = 'No focusable elements';
      container.appendChild(p);

      // Act
      const cleanup = AccessibilityManager.createFocusTrap(container);

      // Assert - should not throw
      expect(() => cleanup()).not.toThrow();
    });

    it('should restore focus on cleanup', () => {
      // Arrange
      const outsideButton = document.createElement('button');
      outsideButton.id = 'outside';
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const container = document.createElement('div');
      const insideButton = document.createElement('button');
      insideButton.textContent = 'Inside';
      container.appendChild(insideButton);
      document.body.appendChild(container);

      // Act
      const cleanup = AccessibilityManager.createFocusTrap(container);
      container.querySelector('button')?.focus();
      cleanup();

      // Assert
      expect(document.activeElement).toBe(outsideButton);
    });

    it('should ignore non-Tab keys', () => {
      // Arrange
      const container = document.createElement('div');
      const button = document.createElement('button');
      button.textContent = 'Button';
      container.appendChild(button);
      document.body.appendChild(container);

      // Act
      const cleanup = AccessibilityManager.createFocusTrap(container);

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });

      let defaultPrevented = false;
      enterEvent.preventDefault = (): void => {
        defaultPrevented = true;
      };

      container.dispatchEvent(enterEvent);

      // Assert - non-Tab keys should not be prevented
      expect(defaultPrevented).toBe(false);

      // Cleanup
      cleanup();
    });
  });

  describe('setupModalAria', () => {
    it('should add required ARIA attributes', () => {
      // Arrange
      const modal = document.createElement('div');
      const labelId = 'modal-title';
      const descriptionId = 'modal-desc';

      // Act
      AccessibilityManager.setupModalAria(modal, labelId, descriptionId);

      // Assert
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('aria-labelledby')).toBe(labelId);
      expect(modal.getAttribute('aria-describedby')).toBe(descriptionId);
    });

    it('should work without description ID', () => {
      // Arrange
      const modal = document.createElement('div');
      const labelId = 'modal-title';

      // Act
      AccessibilityManager.setupModalAria(modal, labelId);

      // Assert
      expect(modal.getAttribute('aria-labelledby')).toBe(labelId);
      expect(modal.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('createScreenReaderOnly', () => {
    it('should create span with screen reader only class', () => {
      // Act
      const element =
        AccessibilityManager.createScreenReaderOnly('Hidden text');

      // Assert
      expect(element.tagName).toBe('SPAN');
      expect(element.textContent).toBe('Hidden text');
      expect(element.className).toBe(
        CSS_CLASSES.ACCESSIBILITY.SCREEN_READER_ONLY
      );
      expect(element.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('cleanup', () => {
    it('should remove announcement element', () => {
      // Arrange
      AccessibilityManager.announce('Test');
      expect(document.querySelector('[aria-live]')).toBeTruthy();

      // Act
      AccessibilityManager.cleanup();

      // Assert
      expect(document.querySelector('[aria-live]')).toBeFalsy();
    });

    it('should handle cleanup when no announcement exists', () => {
      // Act & Assert - should not throw
      expect(() => AccessibilityManager.cleanup()).not.toThrow();
    });

    it('should allow creating new announcement after cleanup', () => {
      // Arrange
      AccessibilityManager.announce('First');
      AccessibilityManager.cleanup();

      // Act
      AccessibilityManager.announce('Second');

      // Assert
      const announcement = document.querySelector('[aria-live]');
      expect(announcement?.textContent).toBe('Second');
    });
  });
});
