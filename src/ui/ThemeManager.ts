/**
 * ThemeManager handles theme initialization for the Humanmark SDK
 * Supports light, dark, and auto themes via CSS
 */

import type { HumanmarkConfig } from '@/types/config';

export class ThemeManager {
  /**
   * Initialize theme by setting data-hm-theme attribute
   * CSS handles all theme logic including auto theme via media queries
   */
  static initialize(theme: HumanmarkConfig['theme'] = 'dark'): void {
    document.documentElement.setAttribute('data-hm-theme', theme ?? 'dark');
  }
}
