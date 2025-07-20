/**
 * Lazy loading utilities for code splitting
 * Provides type-safe dynamic imports with caching
 */

import { HumanmarkError } from '@/errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';

// Cache for loaded modules to avoid re-importing
const moduleCache = new Map<string, unknown>();

/**
 * Loads a module lazily with caching
 * @param moduleLoader - Function that returns the dynamic import promise
 * @param cacheKey - Unique key for caching the loaded module
 * @returns The loaded module
 */
export async function lazyLoad<T>(
  moduleLoader: () => Promise<T>,
  cacheKey: string
): Promise<T> {
  // Check cache first
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey) as T;
  }

  try {
    // Load the module
    const module = await moduleLoader();

    // Cache for future use
    moduleCache.set(cacheKey, module);

    return module;
  } catch (error) {
    throw new HumanmarkError(
      `Failed to load module '${cacheKey}': ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      ErrorCode.MODULE_LOAD_FAILED
    );
  }
}

/**
 * Preloads modules in the background for better performance
 * @param modules - Array of module loader configurations
 */
export async function preloadModules(
  modules: Array<{ loader: () => Promise<unknown>; key: string }>
): Promise<void> {
  // Load all modules in parallel but don't wait for them
  const promises = modules.map(({ loader, key }) =>
    lazyLoad(loader, key).catch(() => {
      // Silently ignore preload failures - the module will be loaded on-demand if needed
    })
  );

  // Wait for all preloads to complete
  await Promise.all(promises);
}

/**
 * Clears the module cache
 * Useful for testing or when modules need to be reloaded
 */
export function clearModuleCache(): void {
  moduleCache.clear();
}
