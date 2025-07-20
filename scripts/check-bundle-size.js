#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Bundle size limits in bytes
const SIZE_LIMITS = {
  'esm/index.js': 11 * 1024,       // 11KB for ESM
  'umd/index.js': 70 * 1024,       // 70KB for UMD
  'browser/index.js': 70 * 1024,   // 70KB for IIFE
};

// Total size limit for all bundles combined
const TOTAL_SIZE_LIMIT = 150 * 1024; // 150KB total

// Additional checks for chunk sizes (if they exist)
const CHUNK_SIZE_LIMITS = {
  'UIManager-': 80 * 1024,          // 80KB for UI Manager chunks
  'ui-': 30 * 1024,                 // 30KB for UI chunks
  'mobile-': 5 * 1024,              // 5KB for mobile chunks
  'index-': 40 * 1024,              // 40KB for other chunks
  'QRCodeGenerator-': 65 * 1024,    // 65KB for QR code generator chunks
  'DeepLinkHandler-': 10 * 1024,    // 10KB for deep link handler chunks
};

// Check if a size exceeds the limit by a certain threshold
const WARN_THRESHOLD = 0.9; // Warn at 90% of limit

function formatBytes(bytes) {
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

function checkBundleSizes() {
  console.log('🔍 Checking bundle sizes...\n');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  const distDir = join(rootDir, 'dist');
  
  try {
    // Check each bundle format
    for (const [bundlePath, limit] of Object.entries(SIZE_LIMITS)) {
      const fullPath = join(distDir, bundlePath);
      
      try {
        const stats = statSync(fullPath);
        const size = stats.size;
        const ratio = size / limit;
        
        if (size > limit) {
          hasErrors = true;
          console.error(`❌ ${bundlePath}: ${formatBytes(size)} (limit: ${formatBytes(limit)}) - ${((ratio - 1) * 100).toFixed(1)}% over limit`);
        } else if (ratio > WARN_THRESHOLD) {
          hasWarnings = true;
          console.warn(`⚠️  ${bundlePath}: ${formatBytes(size)} (limit: ${formatBytes(limit)}) - ${(ratio * 100).toFixed(1)}% of limit`);
        } else {
          console.log(`✅ ${bundlePath}: ${formatBytes(size)} (limit: ${formatBytes(limit)}) - ${(ratio * 100).toFixed(1)}% of limit`);
        }
      } catch (error) {
        console.error(`❌ ${bundlePath}: File not found`);
        hasErrors = true;
      }
    }
    
    // Check chunk sizes if they exist
    console.log('\n📦 Checking chunk sizes...\n');
    
    try {
      const files = readdirSync(distDir);
      const chunkFiles = files.filter(f => f.endsWith('.js') && f.includes('-'));
      
      for (const chunkFile of chunkFiles) {
        const fullPath = join(distDir, chunkFile);
        const stats = statSync(fullPath);
        const size = stats.size;
        
        // Find matching chunk limit
        let limit = null;
        for (const [prefix, chunkLimit] of Object.entries(CHUNK_SIZE_LIMITS)) {
          if (chunkFile.includes(prefix)) {
            limit = chunkLimit;
            break;
          }
        }
        
        if (limit) {
          const ratio = size / limit;
          
          if (size > limit) {
            hasErrors = true;
            console.error(`❌ ${chunkFile}: ${formatBytes(size)} (limit: ${formatBytes(limit)}) - ${((ratio - 1) * 100).toFixed(1)}% over limit`);
          } else if (ratio > WARN_THRESHOLD) {
            hasWarnings = true;
            console.warn(`⚠️  ${chunkFile}: ${formatBytes(size)} (limit: ${formatBytes(limit)}) - ${(ratio * 100).toFixed(1)}% of limit`);
          } else {
            console.log(`✅ ${chunkFile}: ${formatBytes(size)} (limit: ${formatBytes(limit)}) - ${(ratio * 100).toFixed(1)}% of limit`);
          }
        }
      }
    } catch (error) {
      // Chunks might not exist in all build configurations
      console.log('ℹ️  No chunks found (this is normal for non-ESM builds)');
    }
    
    console.log('\n📊 Bundle Size Summary:');
    
    // Calculate total size
    let totalSize = 0;
    for (const bundlePath of Object.keys(SIZE_LIMITS)) {
      try {
        const fullPath = join(distDir, bundlePath);
        const stats = statSync(fullPath);
        totalSize += stats.size;
      } catch (error) {
        // Ignore missing files for total
      }
    }
    
    console.log(`   Total size: ${formatBytes(totalSize)} (limit: ${formatBytes(TOTAL_SIZE_LIMIT)})`);
    console.log(`   Average size: ${formatBytes(totalSize / Object.keys(SIZE_LIMITS).length)}`);
    
    // Check total size limit
    if (totalSize > TOTAL_SIZE_LIMIT) {
      hasErrors = true;
      console.error(`\n❌ Total bundle size exceeds limit: ${formatBytes(totalSize)} > ${formatBytes(TOTAL_SIZE_LIMIT)}`);
    } else if (totalSize > TOTAL_SIZE_LIMIT * WARN_THRESHOLD) {
      hasWarnings = true;
      console.warn(`\n⚠️  Total bundle size approaching limit: ${formatBytes(totalSize)} (${(totalSize / TOTAL_SIZE_LIMIT * 100).toFixed(1)}% of limit)`);
    }
    
    if (hasErrors) {
      console.error('\n❌ Bundle size check failed! Some bundles exceed their limits.');
      console.error('   Consider:');
      console.error('   - Removing unnecessary dependencies');
      console.error('   - Enabling code splitting');
      console.error('   - Using dynamic imports for large features');
      console.error('   - Reviewing the bundle analysis report\n');
      process.exit(1);
    } else if (hasWarnings) {
      console.warn('\n⚠️  Warning: Some bundles are approaching their size limits.');
      console.warn('   Monitor bundle sizes to prevent future issues.\n');
    } else {
      console.log('\n✅ All bundle sizes are within limits!\n');
    }
    
  } catch (error) {
    console.error('Error checking bundle sizes:', error.message);
    process.exit(1);
  }
}

// Run the check
checkBundleSizes();