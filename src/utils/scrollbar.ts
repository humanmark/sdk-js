/**
 * Utilities for handling scrollbar-related layout shifts
 */

import { isMobileDevice } from '@/utils/device';

/**
 * Cache for scrollbar width calculation
 */
let cachedScrollbarWidth: number | null = null;

/**
 * Calculate the width of the browser's scrollbar
 */
export function getScrollbarWidth(): number {
  // Return cached value if available
  if (cachedScrollbarWidth !== null) {
    return cachedScrollbarWidth;
  }

  // Create a temporary div with scrollbar
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  outer.style.width = '100px';
  outer.style.position = 'absolute';
  outer.style.top = '-9999px';
  document.body.appendChild(outer);

  // Force scrollbar to appear
  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  // Calculate scrollbar width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Clean up
  document.body.removeChild(outer);

  // Cache the result
  cachedScrollbarWidth = scrollbarWidth;

  return scrollbarWidth;
}

/**
 * Check if the page currently has a visible scrollbar
 */
export function hasVisibleScrollbar(): boolean {
  return document.documentElement.scrollHeight > window.innerHeight;
}

/**
 * Lock body scroll and prevent layout shift
 */
export function lockBodyScroll(): void {
  // Skip all scrollbar compensation on mobile devices
  // Mobile browsers use overlay scrollbars that don't affect layout
  if (!isMobileDevice() && hasVisibleScrollbar()) {
    const scrollbarWidth = getScrollbarWidth();

    if (scrollbarWidth > 0) {
      // Store original padding-right value
      const originalPaddingRight = window.getComputedStyle(
        document.body
      ).paddingRight;
      document.body.setAttribute(
        'data-humanmark-original-padding',
        originalPaddingRight
      );

      // Apply compensating padding
      const currentPadding = parseFloat(originalPaddingRight) || 0;
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
  }

  // Add the body lock class (this will trigger overflow: hidden)
  document.body.classList.add('humanmark-modal-open');
}

/**
 * Unlock body scroll and restore original state
 */
export function unlockBodyScroll(): void {
  // Remove the body lock class
  document.body.classList.remove('humanmark-modal-open');

  // Restore original padding if it was modified
  const originalPadding = document.body.getAttribute(
    'data-humanmark-original-padding'
  );
  if (originalPadding !== null) {
    document.body.style.paddingRight = originalPadding;
    document.body.removeAttribute('data-humanmark-original-padding');
  }
}

/**
 * Clear cached scrollbar width (useful for testing or when system settings change)
 */
export function clearScrollbarWidthCache(): void {
  cachedScrollbarWidth = null;
}
