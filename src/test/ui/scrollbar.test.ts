import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getScrollbarWidth,
  hasVisibleScrollbar,
  lockBodyScroll,
  unlockBodyScroll,
  clearScrollbarWidthCache,
} from '@/utils/scrollbar';
import * as deviceUtils from '@/utils/device';

describe('Scrollbar Utilities', () => {
  beforeEach(() => {
    // Clear any cached values
    clearScrollbarWidthCache();

    // Reset body styles
    document.body.style.paddingRight = '';
    document.body.className = '';
    document.body.removeAttribute('data-humanmark-original-padding');
  });

  afterEach(() => {
    // Clean up after each test
    document.body.style.paddingRight = '';
    document.body.className = '';
    document.body.removeAttribute('data-humanmark-original-padding');
  });

  describe('getScrollbarWidth', () => {
    it('should calculate scrollbar width', () => {
      const width = getScrollbarWidth();
      expect(width).toBeGreaterThanOrEqual(0);
      expect(width).toBeLessThanOrEqual(20); // Reasonable maximum
    });

    it('should cache the scrollbar width', () => {
      const firstCall = getScrollbarWidth();
      const secondCall = getScrollbarWidth();
      expect(firstCall).toBe(secondCall);
    });
  });

  describe('hasVisibleScrollbar', () => {
    it('should detect visible scrollbar', () => {
      // Mock scrollHeight > innerHeight (has scrollbar)
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });

      expect(hasVisibleScrollbar()).toBe(true);

      // Mock scrollHeight <= innerHeight (no scrollbar)
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 800,
        configurable: true,
      });

      expect(hasVisibleScrollbar()).toBe(false);
    });
  });

  describe('lockBodyScroll / unlockBodyScroll', () => {
    it('should add modal-open class when locking', () => {
      lockBodyScroll();
      expect(document.body.classList.contains('humanmark-modal-open')).toBe(
        true
      );
    });

    it('should remove modal-open class when unlocking', () => {
      lockBodyScroll();
      unlockBodyScroll();
      expect(document.body.classList.contains('humanmark-modal-open')).toBe(
        false
      );
    });

    it('should apply padding compensation when scrollbar is visible', () => {
      // Mock visible scrollbar
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });

      // Mock scrollbar width
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        paddingRight: '10px',
      } as CSSStyleDeclaration);

      // Mock the internal calculation
      clearScrollbarWidthCache();
      const originalCreateElement = document.createElement.bind(document);
      const createElementMock = vi.fn((tagName: string) => {
        const elem = originalCreateElement(tagName);
        if (tagName === 'div') {
          Object.defineProperty(elem, 'offsetWidth', {
            get() {
              const divElem = this as HTMLDivElement;
              return divElem.style.overflow === 'scroll' ? 100 : 85;
            },
            configurable: true,
          });
        }
        return elem;
      });
      document.createElement =
        createElementMock as typeof document.createElement;

      lockBodyScroll();

      // Should store original padding
      expect(
        document.body.getAttribute('data-humanmark-original-padding')
      ).toBe('10px');

      // Clean up
      unlockBodyScroll();
      expect(
        document.body.getAttribute('data-humanmark-original-padding')
      ).toBeNull();

      // Restore mocks
      document.createElement = originalCreateElement;
    });

    it('should not apply padding when no scrollbar is visible', () => {
      // Mock no visible scrollbar
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 500,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });

      const originalPadding = document.body.style.paddingRight;

      lockBodyScroll();

      // Should not modify padding when no scrollbar is visible
      expect(document.body.style.paddingRight).toBe(originalPadding);
      expect(
        document.body.getAttribute('data-humanmark-original-padding')
      ).toBeNull();
    });

    it('should not apply padding compensation on mobile devices', () => {
      // Mock mobile device
      vi.spyOn(deviceUtils, 'isMobileDevice').mockReturnValue(true);

      // Mock visible scrollbar (which would normally trigger compensation)
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });

      const originalPadding = document.body.style.paddingRight;

      lockBodyScroll();

      // Should still add the modal-open class
      expect(document.body.classList.contains('humanmark-modal-open')).toBe(
        true
      );

      // But should NOT modify padding on mobile
      expect(document.body.style.paddingRight).toBe(originalPadding);
      expect(
        document.body.getAttribute('data-humanmark-original-padding')
      ).toBeNull();

      // Clean up
      unlockBodyScroll();
      vi.restoreAllMocks();
    });
  });
});
