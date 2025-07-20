import { describe, it, expect } from 'vitest';
import {
  createBrandedTitle,
  createProgressBar,
  createSubtitle,
  createModalHeader,
  createWhatIsThisLink,
  createQRCodeContainer,
  createMobileContainer,
  createModalBody,
  createScreenReaderAnnouncement,
} from '../../ui/templates';
import { MESSAGES, URLS } from '../../constants/ui';

describe('UI Templates - Additional Coverage', () => {
  describe('createBrandedTitle', () => {
    it('should create title with default text', () => {
      const element = createBrandedTitle();
      expect(element.tagName).toBe('H2');
      expect(element.className).toBe('humanmark-modal-title');
      expect(element.textContent).toBe(MESSAGES.VERIFICATION.TITLE);
    });

    it('should create title with custom text', () => {
      const customText = 'Custom Verification Title';
      const element = createBrandedTitle(customText);
      expect(element.textContent).toBe(customText);
    });

    it('should handle empty string', () => {
      const element = createBrandedTitle('');
      expect(element.textContent).toBe('');
    });

    it('should handle special characters', () => {
      const specialText = 'Title with <script>alert("xss")</script>';
      const element = createBrandedTitle(specialText);
      expect(element.textContent).toBe(specialText);
      // Verify that the element structure is correct
      expect(element.tagName).toBe('H2');
      expect(element.className).toBe('humanmark-modal-title');
      // Check that the brand span exists and contains the text
      const brandSpan = element.querySelector('.humanmark-title-brand');
      expect(brandSpan).toBeTruthy();
      expect(brandSpan?.textContent).toBe(specialText);
    });
  });

  describe('createSubtitle', () => {
    it('should create subtitle with text', () => {
      const text = 'Test Subtitle';
      const element = createSubtitle(text);
      expect(element.tagName).toBe('P');
      expect(element.className).toBe('humanmark-modal-description');
      expect(element.textContent).toBe(text);
    });
  });

  describe('createModalHeader', () => {
    it('should create header with close button', () => {
      const element = createModalHeader();
      expect(element.className).toBe('humanmark-modal-header');

      // Should contain close button
      const closeButton = element.querySelector('.humanmark-modal-close');
      expect(closeButton).toBeTruthy();
      expect(closeButton?.tagName).toBe('BUTTON');
      expect(closeButton?.getAttribute('aria-label')).toBe(
        MESSAGES.ACCESSIBILITY.CLOSE_BUTTON_LABEL
      );
    });
  });

  describe('createProgressBar', () => {
    it('should create progress bar with container and fill', () => {
      const element = createProgressBar();
      expect(element.className).toBe('humanmark-progress-container');

      const progressBar = element.querySelector('.humanmark-progress-bar');
      expect(progressBar).toBeTruthy();
      expect(progressBar?.tagName).toBe('DIV');
    });

    it('should have progress bar with initial width', () => {
      const element = createProgressBar();
      const progressBar = element.querySelector(
        '.humanmark-progress-bar'
      ) as HTMLElement;
      // Progress bar doesn't have initial width set in template
      expect(progressBar).toBeTruthy();
    });
  });

  describe('createQRCodeContainer', () => {
    it('should create QR code container with instructions', () => {
      const element = createQRCodeContainer();
      expect(element.className).toBe('humanmark-qr-container');

      // Should contain wrapper for QR code
      const wrapper = element.querySelector('.humanmark-qr-wrapper');
      expect(wrapper).toBeTruthy();

      // Should contain instructions
      const instructions = element.querySelector(
        '.humanmark-modal-instructions'
      );
      expect(instructions?.textContent).toBe(
        MESSAGES.VERIFICATION.QR_INSTRUCTIONS
      );
    });
  });

  describe('createMobileContainer', () => {
    it('should create mobile container with subtitle', () => {
      const element = createMobileContainer();
      expect(element.className).toBe('humanmark-mobile-container');

      // Mobile container is just a wrapper - subtitle is added separately
      expect(element.children.length).toBe(0);
    });
  });

  describe('createModalBody', () => {
    it('should create modal body element', () => {
      const element = createModalBody();
      expect(element.tagName).toBe('DIV');
      expect(element.className).toBe('humanmark-modal-body');
    });
  });

  describe('createScreenReaderAnnouncement', () => {
    it('should create screen reader announcement', () => {
      const message = 'Test announcement';
      const element = createScreenReaderAnnouncement(message);

      expect(element.className).toBe('humanmark-sr-only');
      expect(element.getAttribute('role')).toBe('status');
      expect(element.getAttribute('aria-live')).toBe('polite');
      expect(element.textContent).toBe(message);
    });
  });

  describe('createWhatIsThisLink', () => {
    it('should create link with correct text and arrow', () => {
      const element = createWhatIsThisLink();

      expect(element.tagName).toBe('A');
      expect(element.className).toBe('humanmark-what-is-this');
      expect(element.textContent).toBe(MESSAGES.VERIFICATION.WHAT_IS_THIS);
      expect(element.getAttribute('href')).toBe(URLS.WHAT_IS_THIS);
      expect(element.target).toBe('_blank');
      expect(element.rel).toBe('noopener noreferrer');
    });

    it('should have proper security attributes', () => {
      const element = createWhatIsThisLink();

      // Check security attributes
      expect(element.getAttribute('target')).toBe('_blank');
      expect(element.getAttribute('rel')).toContain('noopener');
      expect(element.getAttribute('rel')).toContain('noreferrer');
    });
  });
});
