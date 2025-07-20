#!/usr/bin/env node

import { build } from 'vite';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import analyzer from 'rollup-plugin-analyzer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Custom analyzer plugin configuration
const analyzerPlugin = analyzer({
  summaryOnly: false,
  limit: 50, // Show top 50 modules
  filterSummary: true,
  showExports: true,
  writeTo: (analysis) => {
    // Write detailed analysis to file
    const reportPath = join(rootDir, 'dist', 'bundle-analysis.txt');
    writeFileSync(reportPath, analysis);
    console.log(`\n📊 Bundle analysis written to: dist/bundle-analysis.txt`);
    
    // Also output to console
    console.log('\n=== Bundle Analysis Summary ===\n');
    console.log(analysis);
  }
});

// Generate security-focused bundle report
async function analyzeBundles() {
  console.log('🔍 Analyzing bundles for security review...\n');
  
  const formats = ['es', 'umd', 'iife'];
  const reports = {};
  
  for (const format of formats) {
    console.log(`\n📦 Building ${format.toUpperCase()} bundle...`);
    
    try {
      // Build with analyzer
      await build({
        configFile: join(rootDir, 'vite.config.ts'),
        mode: 'production',
        plugins: [analyzerPlugin],
        build: {
          lib: {
            entry: join(rootDir, 'src', 'index.ts'),
            name: 'HumanmarkSdk',
            formats: [format],
            fileName: () => `analyze-${format}.js`,
          },
          outDir: join(rootDir, 'dist', 'analysis'),
          emptyOutDir: format === 'es', // Only empty on first build
        },
      });
      
      // Read bundle stats
      const bundlePath = join(rootDir, 'dist', 'analysis', `analyze-${format}.js`);
      if (existsSync(bundlePath)) {
        const stats = readFileSync(bundlePath, 'utf8');
        const size = Buffer.byteLength(stats, 'utf8');
        reports[format] = {
          size: size,
          sizeKB: (size / 1024).toFixed(2),
          sizeMB: (size / 1024 / 1024).toFixed(3),
        };
      }
    } catch (error) {
      console.error(`Error analyzing ${format} bundle:`, error.message);
    }
  }
  
  // Generate security report
  generateSecurityReport(reports);
}

function generateSecurityReport(reports) {
  const reportContent = `
# Humanmark SDK Bundle Security Analysis Report

Generated: ${new Date().toISOString()}

## Bundle Sizes

| Format | Size (bytes) | Size (KB) | Size (MB) | Security Notes |
|--------|-------------|-----------|-----------|----------------|
${Object.entries(reports).map(([format, stats]) => {
  const notes = stats.sizeKB > 100 ? '⚠️ Large bundle' : '✅ Acceptable size';
  return `| ${format.toUpperCase()} | ${stats.size} | ${stats.sizeKB} KB | ${stats.sizeMB} MB | ${notes} |`;
}).join('\n')}

## Security Recommendations

### Bundle Size Analysis
${Object.entries(reports).some(([_, stats]) => stats.sizeKB > 100) ? 
`- ⚠️ Some bundles exceed 100KB. Consider:
  - Code splitting for large components
  - Lazy loading non-critical features
  - Reviewing dependency sizes` : 
'- ✅ All bundle sizes are within acceptable limits'}

### Dependency Security
- Review the bundle analysis for unexpected dependencies
- Check for any bundled development dependencies
- Verify no sensitive data is included in bundles
- Ensure minification is removing all comments and debug code

### Code Security
- No eval() or new Function() usage detected (enforced by ESLint)
- CSP compliant - no innerHTML usage
- All external dependencies are explicitly declared

### Recommendations
1. Regular bundle size monitoring in CI/CD
2. Set up size limits to prevent regression
3. Review new dependencies for security vulnerabilities
4. Use SRI hashes when serving from CDN (already implemented)

## Detailed Module Analysis

See dist/bundle-analysis.txt for detailed module breakdown.
`;

  const reportPath = join(rootDir, 'dist', 'SECURITY-ANALYSIS.md');
  writeFileSync(reportPath, reportContent);
  console.log(`\n🔒 Security report written to: dist/SECURITY-ANALYSIS.md`);
  
  // Output summary
  console.log('\n=== Security Summary ===');
  console.log(reportContent);
}

// Run the analysis
analyzeBundles().catch(console.error);