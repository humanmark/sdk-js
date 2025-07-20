import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'e2e/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test/**',
        'src/test/**',
        '**/*.d.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'scripts/**',
        // Exclude type definition files
        'src/types/**',
        // Exclude the index file that just re-exports
        'src/index.ts',
        'src/ui/index.ts',
        'src/errors/index.ts',
        // Exclude generated protobuf files
        'src/generated/**',
      ],
      include: ['src/**/*.ts'],
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('src'),
      '@/types': path.resolve('src/types'),
      '@/core': path.resolve('src/core'),
      '@/ui': path.resolve('src/ui'),
      '@/utils': path.resolve('src/utils'),
      '@/constants': path.resolve('src/constants'),
    },
  },
});