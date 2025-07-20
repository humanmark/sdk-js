/**
 * Color Constants for TypeScript Usage
 * Only includes colors actually used in TypeScript code
 * Full color system is defined in humanmark.css as CSS variables
 */

/**
 * Primary Colors - Used in TypeScript
 */
export const PRIMARY_COLORS = {
  200: '#C7BDFF',
  500: '#7C63FF',
} as const;

/**
 * Semantic Colors - Used in TypeScript
 */
export const SEMANTIC_COLORS = {
  error: {
    400: '#FF6B6B',
  },
  warning: {
    400: '#FFB74D',
  },
} as const;

/**
 * Common UI Colors
 */
export const UI_COLORS = {
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

/**
 * Note: Complete color system including all scales, alpha values, shadows,
 * and theme-specific mappings are defined as CSS variables in
 * humanmark.css for optimal performance and theme switching.
 */
