/**
 * Accessibility utilities for Humanmark UI components
 * Provides ARIA support, focus management, and screen reader announcements
 */

import {
  CSS_CLASSES,
  FOCUSABLE_SELECTORS,
  KEYBOARD_KEYS,
  ANIMATION_TIMINGS,
} from '@/constants/ui';

export class AccessibilityManager {
  private static announcementElement: HTMLDivElement | null = null;

  /**
   * Announces a message to screen readers
   * @param message - The message to announce
   * @param priority - 'polite' waits for current speech, 'assertive' interrupts
   */
  static announce(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ): void {
    // Create announcement element if it doesn't exist
    if (!this.announcementElement) {
      this.announcementElement = document.createElement('div');
      this.announcementElement.setAttribute('aria-live', priority);
      this.announcementElement.setAttribute('aria-atomic', 'true');
      this.announcementElement.className =
        CSS_CLASSES.ACCESSIBILITY.SCREEN_READER_ONLY;
      document.body.appendChild(this.announcementElement);
    }

    // Update announcement
    this.announcementElement.setAttribute('aria-live', priority);
    this.announcementElement.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcementElement) {
        this.announcementElement.textContent = '';
      }
    }, ANIMATION_TIMINGS.ANNOUNCEMENT_CLEAR);
  }

  /**
   * Creates a focus trap within an element
   * @param container - The container element to trap focus within
   * @returns Cleanup function to remove the trap
   */
  static createFocusTrap(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      FOCUSABLE_SELECTORS.join(',')
    );

    if (focusableElements.length === 0) return () => {};

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== KEYBOARD_KEYS.TAB) return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable && lastFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable && firstFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }

  /**
   * Adds ARIA attributes for modal dialogs
   * @param modal - The modal element
   * @param labelId - ID of the element that labels the modal
   * @param descriptionId - ID of the element that describes the modal
   */
  static setupModalAria(
    modal: HTMLElement,
    labelId: string,
    descriptionId?: string
  ): void {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', labelId);

    if (descriptionId) {
      modal.setAttribute('aria-describedby', descriptionId);
    }
  }

  /**
   * Creates a visually hidden but screen reader accessible element
   * @param content - The content for screen readers
   * @returns The created element
   */
  static createScreenReaderOnly(content: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.textContent = content;
    span.className = CSS_CLASSES.ACCESSIBILITY.SCREEN_READER_ONLY;
    span.setAttribute('aria-hidden', 'false');
    return span;
  }

  /**
   * Cleanup function to remove announcement element
   */
  static cleanup(): void {
    if (this.announcementElement?.parentNode) {
      this.announcementElement.parentNode.removeChild(this.announcementElement);
      this.announcementElement = null;
    }
  }
}
