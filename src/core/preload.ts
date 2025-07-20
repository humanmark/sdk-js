/**
 * Preload UI components for better performance
 * This is a separate entry point to avoid static/dynamic import conflicts
 */
export async function preloadUIComponents(): Promise<void> {
  const { preloadUIComponents } = await import('@/ui');
  return preloadUIComponents();
}
