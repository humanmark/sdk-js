import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import analyzer from 'rollup-plugin-analyzer';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    cssInjectedByJsPlugin(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
    }),
    // Bundle analyzer plugin for security review
    ...(process.env.ANALYZE ? [analyzer({
      summaryOnly: false,
      limit: 20, // Show top 20 modules
      filterSummary: true,
      showExports: true,
      writeTo: (analysis) => {
        console.log('\n📊 Bundle Analysis Report:\n');
        console.log(analysis);
      }
    })] : []),
  ],
  build: {
    lib: {
      entry: path.resolve('src/index.ts'),
      name: 'HumanmarkSdk',
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => {
        switch (format) {
          case 'es':
            return 'esm/index.js';
          case 'umd':
            return 'umd/index.js';
          case 'iife':
            return 'browser/index.js';
          default:
            return 'index.js';
        }
      },
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
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
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});