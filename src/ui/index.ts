/**
 * UI module exports with code splitting support
 * These components are loaded on-demand to reduce initial bundle size
 */

import { lazyLoad, preloadModules } from '@/core/LazyLoader';

// Lazy load UI components for better performance and security isolation
export async function loadQRCodeGenerator(): Promise<
  typeof import('./QRCodeGenerator').QRCodeGenerator
> {
  const module = await lazyLoad(
    () => import('./QRCodeGenerator'),
    'QRCodeGenerator'
  );
  return module.QRCodeGenerator;
}

export async function loadUIManager(): Promise<
  typeof import('./UIManager').UIManager
> {
  const module = await lazyLoad(() => import('./UIManager'), 'UIManager');
  return module.UIManager;
}

export async function loadDeepLinkHandler(): Promise<
  typeof import('./DeepLinkHandler').DeepLinkHandler
> {
  const module = await lazyLoad(
    () => import('./DeepLinkHandler'),
    'DeepLinkHandler'
  );
  return module.DeepLinkHandler;
}

/**
 * Preload UI components in the background for better performance
 * This can be called after SDK initialization to warm up the cache
 */
export async function preloadUIComponents(): Promise<void> {
  return preloadModules([
    { loader: () => import('./UIManager'), key: 'UIManager' },
    { loader: () => import('./QRCodeGenerator'), key: 'QRCodeGenerator' },
    { loader: () => import('./DeepLinkHandler'), key: 'DeepLinkHandler' },
  ]);
}

// Type exports for compile-time usage
export type { QRCodeOptions } from './QRCodeGenerator';
export type { DeepLinkHandler } from './DeepLinkHandler';
export type { UIManager } from './UIManager';
