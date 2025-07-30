/**
 * UI Template functions for creating consistent UI components
 * Separates structure from logic for better maintainability
 */

import { createElement, appendChildren } from '@/utils/dom';
import { CSS_CLASSES, MESSAGES, ELEMENT_IDS, ARIA, URLS } from '@/constants/ui';
import { createSuccessCheckmarkSVG, createCloseButtonSVG } from './SVGBuilder';

/**
 * Creates the Humanmark icon SVG element
 */
export function createHumanmarkIcon(): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 1024 1024');
  svg.setAttribute('class', 'humanmark-icon');

  // Create the icon paths
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('fill', '#9580ff');
  path1.setAttribute(
    'd',
    'M 511.367523 495.643921 C 623.741394 495.643921 714.83429 404.54895 714.83429 292.177124 C 714.83429 179.805298 623.741394 88.710327 511.367523 88.710327 C 398.995697 88.710327 307.900726 179.805298 307.900726 292.177124 C 307.900726 404.54895 398.995697 495.643921 511.367523 495.643921 Z'
  );

  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('fill', '#9580ff');
  path2.setAttribute(
    'd',
    'M 782.453125 563.264282 C 710.045105 635.674805 613.772278 675.553711 511.365479 675.553711 C 408.964752 675.553711 312.689941 635.674805 240.279861 563.264282 L 37.999184 765.540405 C 119.708984 847.251709 218.834152 905.197937 326.988434 935.999878 C 359.412354 866.653259 429.761475 818.586548 511.365479 818.586548 C 592.975586 818.586548 663.322693 866.653259 695.744568 935.999878 C 803.900879 905.19696 903.028076 847.251709 984.73584 765.540405 L 782.453125 563.264282 Z'
  );

  g.appendChild(path1);
  g.appendChild(path2);
  svg.appendChild(g);

  return svg;
}

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
    attributes: {
      'aria-label': MESSAGES.ACCESSIBILITY.CLOSE_BUTTON_LABEL,
      type: 'button',
    },
  });

  // Add SVG icon to close button
  const closeIcon = createCloseButtonSVG();
  closeButton.appendChild(closeIcon);

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

  // Add the icon
  const icon = createHumanmarkIcon();
  title.appendChild(icon);

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
