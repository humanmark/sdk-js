/**
 * UI Template functions for creating consistent UI components
 * Separates structure from logic for better maintainability
 */

import { createElement, appendChildren } from '@/utils/dom';
import {
  CSS_CLASSES,
  MESSAGES,
  SPECIAL_CHARS,
  ELEMENT_IDS,
  ARIA,
  URLS,
} from '@/constants/ui';
import { createSuccessCheckmarkSVG } from './SVGBuilder';

/**
 * Creates the modal header with title and close button
 */
export function createModalHeader(): HTMLDivElement {
  const header = createElement('div', {
    className: CSS_CLASSES.MODAL.HEADER,
  });

  // Close button
  const closeButton = createElement('button', {
    className: CSS_CLASSES.BUTTONS.CLOSE,
    textContent: SPECIAL_CHARS.CLOSE_BUTTON,
    attributes: {
      'aria-label': MESSAGES.ACCESSIBILITY.CLOSE_BUTTON_LABEL,
      type: 'button',
    },
  });

  header.appendChild(closeButton);
  return header;
}

/**
 * Creates the progress bar container
 */
export function createProgressBar(): HTMLDivElement {
  const container = createElement('div', {
    className: CSS_CLASSES.PROGRESS.CONTAINER,
  });

  const progressBar = createElement('div', {
    className: CSS_CLASSES.PROGRESS.BAR,
    attributes: {
      role: 'progressbar',
      'aria-valuemin': ARIA.PROGRESS.VALUE_MIN,
      'aria-valuemax': ARIA.PROGRESS.VALUE_MAX,
      'aria-valuenow': ARIA.PROGRESS.VALUE_NOW,
      'aria-label': MESSAGES.ACCESSIBILITY.PROGRESS_LABEL,
    },
  });

  container.appendChild(progressBar);
  return container;
}

/**
 * Creates the title element with Humanmark branding
 */
export function createBrandedTitle(
  text: string = MESSAGES.VERIFICATION.TITLE
): HTMLHeadingElement {
  const title = createElement('h2', {
    className: CSS_CLASSES.TITLE.CONTAINER,
    attributes: {
      id: ELEMENT_IDS.TITLE,
    },
  });

  const brandSpan = createElement('span', {
    className: CSS_CLASSES.TITLE.BRAND,
    textContent: text,
  });

  title.appendChild(brandSpan);
  return title;
}

/**
 * Creates the subtitle element
 */
export function createSubtitle(text: string): HTMLParagraphElement {
  return createElement('p', {
    className: CSS_CLASSES.SUBTITLE,
    textContent: text,
    attributes: {
      id: ELEMENT_IDS.DESCRIPTION,
    },
  });
}

/**
 * Creates the success content
 */
export function createSuccessContent(): HTMLDivElement {
  const container = createElement('div', {
    className: CSS_CLASSES.SUCCESS.CONTAINER,
  });

  // Checkmark
  const checkmarkDiv = createElement('div', {
    className: CSS_CLASSES.SUCCESS.CHECKMARK,
  });
  checkmarkDiv.appendChild(createSuccessCheckmarkSVG());

  // Success message
  const message = createElement('div', {
    className: CSS_CLASSES.SUCCESS.MESSAGE,
    textContent: MESSAGES.SUCCESS.TITLE,
  });

  // Success submessage
  const submessage = createElement('div', {
    className: CSS_CLASSES.SUCCESS.SUBMESSAGE,
    textContent: MESSAGES.SUCCESS.SUBTITLE,
  });

  appendChildren(container, checkmarkDiv, message, submessage);
  return container;
}

/**
 * Creates the QR code container structure
 */
export function createQRCodeContainer(): HTMLDivElement {
  const container = createElement('div', {
    className: CSS_CLASSES.QR_CODE.CONTAINER,
  });

  const qrWrapper = createElement('div', {
    className: CSS_CLASSES.QR_CODE.WRAPPER,
  });

  const instructions = createElement('p', {
    className: CSS_CLASSES.QR_CODE.INSTRUCTIONS,
    textContent: MESSAGES.VERIFICATION.QR_INSTRUCTIONS,
  });

  container.appendChild(qrWrapper);
  container.appendChild(instructions);

  return container;
}

/**
 * Creates the mobile container structure
 */
export function createMobileContainer(): HTMLDivElement {
  return createElement('div', {
    className: CSS_CLASSES.MOBILE.CONTAINER,
  });
}

/**
 * Creates the modal body wrapper
 */
export function createModalBody(): HTMLDivElement {
  return createElement('div', {
    className: CSS_CLASSES.MODAL.BODY,
  });
}

/**
 * Creates a screen reader announcement element
 */
export function createScreenReaderAnnouncement(
  message: string
): HTMLDivElement {
  return createElement('div', {
    className: CSS_CLASSES.ACCESSIBILITY.SCREEN_READER_ONLY,
    textContent: message,
    attributes: {
      role: 'status',
      'aria-live': 'polite',
    },
  });
}

/**
 * Creates the "What is this?" link
 */
export function createWhatIsThisLink(): HTMLAnchorElement {
  return createElement('a', {
    className: CSS_CLASSES.LINKS.WHAT_IS_THIS,
    textContent: MESSAGES.VERIFICATION.WHAT_IS_THIS,
    attributes: {
      href: URLS.WHAT_IS_THIS,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  });
}
