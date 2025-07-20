import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  lazyLoad,
  preloadModules,
  clearModuleCache,
} from '../../core/LazyLoader';
import { HumanmarkError } from '../../errors/HumanmarkError';

describe('LazyLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear module cache before each test
    clearModuleCache();
  });

  afterEach(() => {
    // Clean up after tests
    clearModuleCache();
  });

  describe('lazyLoad', () => {
    it('should load a module successfully', async () => {
      const mockModule = { test: 'value' };
      const loader = vi.fn().mockResolvedValue(mockModule);

      const result = await lazyLoad(loader, 'test-module');

      expect(result).toBe(mockModule);
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('should cache loaded modules', async () => {
      const mockModule = { test: 'value' };
      const loader = vi.fn().mockResolvedValue(mockModule);

      // Load twice with same key
      const result1 = await lazyLoad(loader, 'cached-module');
      const result2 = await lazyLoad(loader, 'cached-module');

      expect(result1).toBe(mockModule);
      expect(result2).toBe(mockModule);
      // Loader should only be called once due to caching
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('should handle module loading errors', async () => {
      const error = new Error('Failed to load');
      const loader = vi.fn().mockRejectedValue(error);

      await expect(lazyLoad(loader, 'error-module')).rejects.toThrow(
        HumanmarkError
      );
      await expect(lazyLoad(loader, 'error-module')).rejects.toMatchObject({
        message: expect.stringContaining(
          "Failed to load module 'error-module'"
        ) as unknown as string,
        code: 'module_load_failed',
      });
    });

    it('should throw HumanmarkError on loader failure', async () => {
      const loader = vi.fn().mockRejectedValue(new Error('Load failed'));

      await expect(lazyLoad(loader, 'fail-module')).rejects.toThrow(
        HumanmarkError
      );

      // Should not cache failed modules
      await expect(lazyLoad(loader, 'fail-module')).rejects.toThrow(
        HumanmarkError
      );
      // Loader should be called twice since failure is not cached
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it('should use different caches for different keys', async () => {
      const module1 = { test: 'value1' };
      const module2 = { test: 'value2' };
      const loader1 = vi.fn().mockResolvedValue(module1);
      const loader2 = vi.fn().mockResolvedValue(module2);

      const result1 = await lazyLoad(loader1, 'module-1');
      const result2 = await lazyLoad(loader2, 'module-2');

      expect(result1).toBe(module1);
      expect(result2).toBe(module2);
      expect(loader1).toHaveBeenCalledTimes(1);
      expect(loader2).toHaveBeenCalledTimes(1);
    });

    it('clearModuleCache should clear cached modules', async () => {
      const mockModule = { test: 'value' };
      const loader = vi.fn().mockResolvedValue(mockModule);

      // Load and cache a module
      await lazyLoad(loader, 'clearable-module');
      expect(loader).toHaveBeenCalledTimes(1);

      // Load again - should use cache
      await lazyLoad(loader, 'clearable-module');
      expect(loader).toHaveBeenCalledTimes(1);

      // Clear cache
      clearModuleCache();

      // Load again - should call loader again
      await lazyLoad(loader, 'clearable-module');
      expect(loader).toHaveBeenCalledTimes(2);
    });
  });

  describe('preloadModules', () => {
    it('should preload multiple modules', async () => {
      const module1 = { test: 'value1' };
      const module2 = { test: 'value2' };
      const loader1 = vi.fn().mockResolvedValue(module1);
      const loader2 = vi.fn().mockResolvedValue(module2);

      const modules = [
        { loader: loader1, key: 'preload-1' },
        { loader: loader2, key: 'preload-2' },
      ];

      await preloadModules(modules);

      expect(loader1).toHaveBeenCalledTimes(1);
      expect(loader2).toHaveBeenCalledTimes(1);
    });

    it('should not throw on preload failures', async () => {
      const loader1 = vi.fn().mockResolvedValue({ test: 'value1' });
      const loader2 = vi.fn().mockRejectedValue(new Error('Preload fail'));

      const modules = [
        { loader: loader1, key: 'preload-success' },
        { loader: loader2, key: 'preload-fail' },
      ];

      // Should not throw
      await expect(preloadModules(modules)).resolves.toBeUndefined();

      expect(loader1).toHaveBeenCalledTimes(1);
      expect(loader2).toHaveBeenCalledTimes(1);
    });

    it('should use lazyLoad internally', async () => {
      const module1 = { test: 'value1' };
      const loader1 = vi.fn().mockResolvedValue(module1);

      // Preload a module
      await preloadModules([{ loader: loader1, key: 'preloaded' }]);

      // Now load it directly - should use cache
      const result = await lazyLoad(loader1, 'preloaded');

      expect(result).toBe(module1);
      // Loader should only be called once (during preload)
      expect(loader1).toHaveBeenCalledTimes(1);
    });
  });
});
