import { describe, it, expect, vi } from 'vitest';
import { preloadUIComponents } from '../../core/preload';

// Mock the UI module
vi.mock('@/ui', () => ({
  preloadUIComponents: vi.fn().mockResolvedValue(undefined),
}));

describe('preloadUIComponents', () => {
  it('should dynamically import and call UI preload function', async () => {
    // Arrange
    const mockPreloadUI = vi.fn().mockResolvedValue(undefined);
    vi.doMock('@/ui', () => ({
      preloadUIComponents: mockPreloadUI,
    }));

    // Act
    await preloadUIComponents();

    // Assert
    const uiModule = await import('@/ui');
    expect(uiModule.preloadUIComponents).toHaveBeenCalled();
  });

  it('should handle preload errors gracefully', async () => {
    // Arrange
    const error = new Error('Failed to preload UI components');
    vi.doMock('@/ui', () => ({
      preloadUIComponents: vi.fn().mockRejectedValue(error),
    }));

    // Act & Assert
    await expect(preloadUIComponents()).rejects.toThrow(
      'Failed to preload UI components'
    );
  });
});
