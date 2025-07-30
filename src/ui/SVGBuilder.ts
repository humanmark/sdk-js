/**
 * SVG Builder utilities for creating UI elements
 * Simplifies SVG creation with a clean API
 */

import { createSVGElement } from '@/utils/dom';
import { SVG_DIMENSIONS } from '@/constants/ui';
import { SEMANTIC_COLORS, UI_COLORS } from '@/constants/colors';

/**
 * Creates the success checkmark SVG element
 * @returns Complete SVG element with animated checkmark
 */
export function createSuccessCheckmarkSVG(): SVGSVGElement {
  // Create main SVG element
  const svg = createSVGElement('svg', {
    viewBox: SVG_DIMENSIONS.VIEWBOX,
  });

  // Create circle
  const circle = createSVGElement('circle', {
    class: 'checkmark-circle',
    cx: SVG_DIMENSIONS.CIRCLE.CX,
    cy: SVG_DIMENSIONS.CIRCLE.CY,
    r: SVG_DIMENSIONS.CIRCLE.R,
    fill: 'none',
  });

  // Create checkmark path
  const path = createSVGElement('path', {
    class: 'checkmark-check',
    d: SVG_DIMENSIONS.CHECK_PATH,
    fill: 'none',
  });

  // Assemble SVG
  svg.appendChild(circle);
  svg.appendChild(path);

  return svg;
}

/**
 * Creates a loading spinner SVG
 * @param size - Size in pixels (default: 24)
 * @returns SVG element with loading spinner
 */
export function createLoadingSpinnerSVG(size = 24): SVGSVGElement {
  const svg = createSVGElement('svg', {
    width: size.toString(),
    height: size.toString(),
    viewBox: '0 0 24 24',
    class: 'humanmark-spinner',
  });

  const circle = createSVGElement('circle', {
    cx: '12',
    cy: '12',
    r: '10',
    stroke: 'currentColor',
    'stroke-width': '3',
    fill: 'none',
    'stroke-dasharray': '60',
    'stroke-dashoffset': '0',
    'stroke-linecap': 'round',
  });

  svg.appendChild(circle);
  return svg;
}

/**
 * Creates an error icon SVG
 * @param size - Size in pixels (default: 24)
 * @returns SVG element with error icon
 */
export function createErrorIconSVG(size = 24): SVGSVGElement {
  const svg = createSVGElement('svg', {
    width: size.toString(),
    height: size.toString(),
    viewBox: '0 0 24 24',
    class: 'humanmark-error-icon',
  });

  // Create circle background
  const circle = createSVGElement('circle', {
    cx: '12',
    cy: '12',
    r: '10',
    fill: SEMANTIC_COLORS.error[400],
  });

  // Create X mark
  const path = createSVGElement('path', {
    d: 'M15 9L9 15M9 9L15 15',
    stroke: UI_COLORS.white,
    'stroke-width': '2',
    'stroke-linecap': 'round',
  });

  svg.appendChild(circle);
  svg.appendChild(path);
  return svg;
}

/**
 * Creates a warning icon SVG
 * @param size - Size in pixels (default: 24)
 * @returns SVG element with warning icon
 */
export function createWarningIconSVG(size = 24): SVGSVGElement {
  const svg = createSVGElement('svg', {
    width: size.toString(),
    height: size.toString(),
    viewBox: '0 0 24 24',
    class: 'humanmark-warning-icon',
  });

  // Create triangle path
  const path = createSVGElement('path', {
    d: 'M12 2L2 20h20L12 2z',
    fill: SEMANTIC_COLORS.warning[400],
    stroke: SEMANTIC_COLORS.warning[400],
    'stroke-width': '1',
    'stroke-linejoin': 'round',
  });

  // Create exclamation mark
  const line = createSVGElement('line', {
    x1: '12',
    y1: '9',
    x2: '12',
    y2: '13',
    stroke: UI_COLORS.white,
    'stroke-width': '2',
    'stroke-linecap': 'round',
  });

  const circle = createSVGElement('circle', {
    cx: '12',
    cy: '16',
    r: '1',
    fill: UI_COLORS.white,
  });

  svg.appendChild(path);
  svg.appendChild(line);
  svg.appendChild(circle);
  return svg;
}

/**
 * Creates a close button X icon SVG
 * @param size - Size in pixels (default: 20)
 * @returns SVG element with X icon
 */
export function createCloseButtonSVG(size = 20): SVGSVGElement {
  const svg = createSVGElement('svg', {
    width: size.toString(),
    height: size.toString(),
    viewBox: '0 0 24 24',
    class: 'humanmark-close-icon',
    fill: 'none',
  });

  // Create X with two diagonal lines
  const path = createSVGElement('path', {
    d: 'M18 6L6 18M6 6l12 12',
    stroke: 'currentColor', // Inherits color from parent button
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });

  svg.appendChild(path);
  return svg;
}
