/**
 * UI Constants for the Humanmark SDK
 * Centralizes all UI-related magic numbers, strings, and configuration
 */

/**
 * Standard namespaces for web content
 */
export const NAMESPACES = {
  /** SVG namespace for creating SVG elements */
  SVG: 'http://www.w3.org/2000/svg',
} as const;

/**
 * Animation and timing constants
 */
export const ANIMATION_TIMINGS = {
  /** Duration for fade out animations in milliseconds */
  FADE_OUT: 300,
  /** Duration for modal closing animation in milliseconds */
  MODAL_CLOSE: 300,
  /** Time to display success state before closing in milliseconds */
  SUCCESS_DISPLAY: 1500,
  /** Delay before clearing screen reader announcements in milliseconds */
  ANNOUNCEMENT_CLEAR: 1000,
} as const;

/**
 * Dimensions and sizes
 */
export const DIMENSIONS = {
  /** Default QR code width in pixels */
  QR_CODE_WIDTH: 256,
  /** QR code margin in modules */
  QR_CODE_MARGIN: 2,
} as const;

/**
 * Color constants
 */
import { PRIMARY_COLORS, UI_COLORS } from './colors';

export const COLORS = {
  QR_CODE: {
    /** Foreground color for QR code - using primary brand color */
    DARK: PRIMARY_COLORS[500],
    /** Background color for QR code (transparent) */
    LIGHT: '#0000',
    /** White background option for QR code */
    WHITE: UI_COLORS.white,
    /** Primary theme colors for inverted QR code */
    PRIMARY: PRIMARY_COLORS[500],
    PRIMARY_BG: PRIMARY_COLORS[500],
    /** Secondary theme color - not used in new design */
    SECONDARY: PRIMARY_COLORS[200],
  },
} as const;

/**
 * User-facing messages
 */
export const MESSAGES = {
  VERIFICATION: {
    TITLE: "Verify you're human",
    DESKTOP_SUBTITLE: 'Scan with the Humanmark app',
    MOBILE_SUBTITLE: 'Tap to verify with Humanmark',
    QR_INSTRUCTIONS: 'No personal information will be shared',
    BUTTON_TEXT: 'Verify with Humanmark',
    WHAT_IS_THIS: "What's this? →",
  },
  SUCCESS: {
    TITLE: 'Verified!',
    SUBTITLE: 'Returning to the site...',
  },
  ACCESSIBILITY: {
    QR_ALT_TEXT: 'Humanmark Verification QR Code',
    MODAL_OPENED:
      'Human verification modal opened. Scan QR code or use the provided button to verify.',
    MODAL_CLOSED: 'Verification modal closed',
    VERIFICATION_SUCCESS: 'Human verification successful',
    CLOSE_BUTTON_LABEL: 'Close verification modal',
    PROGRESS_LABEL: 'Time remaining for verification',
    TIME_NOTICE:
      "Scan this code with the Humanmark app to verify you're human.",
  },
  ERRORS: {
    QR_GENERATION_FAILED: 'Failed to generate QR code',
  },
} as const;

/**
 * CSS class names
 */
export const CSS_CLASSES = {
  MODAL: {
    OVERLAY: 'humanmark-modal-overlay',
    CONTENT: 'humanmark-modal-content',
    BODY: 'humanmark-modal-body',
    HEADER: 'humanmark-modal-header',
    CLOSING: 'humanmark-closing',
    BODY_LOCK: 'humanmark-modal-open',
  },
  BUTTONS: {
    CLOSE: 'humanmark-modal-close',
    VERIFY: 'humanmark-verify-button',
  },
  LINKS: {
    WHAT_IS_THIS: 'humanmark-what-is-this',
  },
  PROGRESS: {
    CONTAINER: 'humanmark-progress-container',
    BAR: 'humanmark-progress-bar',
    HIDDEN: 'humanmark-hidden',
  },
  SUCCESS: {
    CONTAINER: 'humanmark-success-container',
    CHECKMARK: 'humanmark-success-checkmark',
    MESSAGE: 'humanmark-success-message',
    SUBMESSAGE: 'humanmark-success-submessage',
    VISIBLE: 'humanmark-success-visible',
  },
  QR_CODE: {
    CONTAINER: 'humanmark-qr-container',
    WRAPPER: 'humanmark-qr-wrapper',
    IMAGE: 'humanmark-qr-image',
    INSTRUCTIONS: 'humanmark-modal-instructions',
  },
  MOBILE: {
    CONTAINER: 'humanmark-mobile-container',
  },
  TITLE: {
    CONTAINER: 'humanmark-modal-title',
    BRAND: 'humanmark-title-brand',
    SUPERSCRIPT: 'humanmark-title-sup',
  },
  SUBTITLE: 'humanmark-modal-description',
  ACCESSIBILITY: {
    SCREEN_READER_ONLY: 'humanmark-sr-only',
  },
  ANIMATIONS: {
    FADE_OUT: 'humanmark-fade-out',
  },
} as const;

/**
 * ARIA attributes
 */
export const ARIA = {
  PROGRESS: {
    VALUE_MIN: '0',
    VALUE_MAX: '120',
    VALUE_NOW: '120',
  },
} as const;

/**
 * Keyboard keys
 */
export const KEYBOARD_KEYS = {
  ESCAPE: 'Escape',
  TAB: 'Tab',
} as const;

/**
 * External URLs
 */
export const URLS = {
  VERIFY_BASE: 'https://humanmark.app/verify',
  WHAT_IS_THIS: 'https://humanmark.app',
} as const;

/**
 * Browser targets
 */
export const BROWSER_TARGETS = {
  BLANK: '_blank',
} as const;

/**
 * DOM element IDs
 */
export const ELEMENT_IDS = {
  MODAL: 'humanmark-verification-modal',
  TITLE: 'humanmark-modal-title',
  DESCRIPTION: 'humanmark-modal-description',
} as const;

/**
 * SVG dimensions for success checkmark
 */
export const SVG_DIMENSIONS = {
  VIEWBOX: '0 0 52 52',
  CIRCLE: {
    CX: '26',
    CY: '26',
    R: '25',
  },
  CHECK_PATH: 'M14.1 27.2l7.1 7.2 16.7-16.8',
} as const;

/**
 * Special characters
 */
export const SPECIAL_CHARS = {
  CLOSE_BUTTON: '×',
} as const;

/**
 * Focusable element selectors for focus trap
 */
export const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
] as const;

/**
 * QR code configuration
 */
export const QR_CONFIG = {
  ERROR_CORRECTION_LEVEL: 'M' as const,
} as const;
