#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Updates README files with SRI hashes from the generated manifest
 */
function updateReadmeWithSRI() {
  // Read the SRI manifest
  const manifestPath = join(rootDir, 'dist', 'sri-manifest.json');
  if (!existsSync(manifestPath)) {
    console.error('❌ SRI manifest not found. Run npm run build:sri first.');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  console.log('📄 Loaded SRI manifest for version', manifest.version);

  // Files to update
  const readmeFiles = [
    join(rootDir, 'README.md'),
    join(rootDir, 'published', 'README.md')
  ];

  readmeFiles.forEach(readmePath => {
    if (!existsSync(readmePath)) {
      console.warn(`⚠️  README not found: ${readmePath}`);
      return;
    }

    console.log(`\n📝 Updating ${readmePath.includes('published') ? 'published' : 'root'} README...`);
    
    let content = readFileSync(readmePath, 'utf8');
    const originalContent = content;

    // Update browser bundle
    const browserHash = manifest.hashes['dist/browser/index.js'];
    if (browserHash) {
      // Match any version and any existing or missing integrity attribute
      content = content.replace(
        /<script\s+src="https:\/\/cdn\.jsdelivr\.net\/npm\/@humanmark\/sdk-js@[^"]*\/dist\/browser\/index\.js"[^>]*>/g,
        `<script 
  src="https://cdn.jsdelivr.net/npm/@humanmark/sdk-js@${manifest.version}/dist/browser/index.js" 
  integrity="${browserHash}"
  crossorigin="anonymous">`
      );
    }

    // Update UMD bundle
    const umdHash = manifest.hashes['dist/umd/index.js'];
    if (umdHash) {
      content = content.replace(
        /<script\s+src="https:\/\/cdn\.jsdelivr\.net\/npm\/@humanmark\/sdk-js@[^"]*\/dist\/umd\/index\.js"[^>]*>/g,
        `<script 
  src="https://cdn.jsdelivr.net/npm/@humanmark/sdk-js@${manifest.version}/dist/umd/index.js" 
  integrity="${umdHash}"
  crossorigin="anonymous">`
      );
    }

    // Also update the comment about SRI support to be more specific
    content = content.replace(
      /- SRI support for CDN usage/g,
      `- SRI support for CDN usage (see integrity attributes in examples)`
    );

    if (content !== originalContent) {
      writeFileSync(readmePath, content);
      console.log('✅ Updated with SRI hashes');
      
      // Show what was updated
      if (browserHash) {
        console.log(`   Browser bundle: ${browserHash}`);
      }
      if (umdHash) {
        console.log(`   UMD bundle: ${umdHash}`);
      }
    } else {
      console.log('ℹ️  No changes needed');
    }
  });

  console.log('\n✨ README files updated with SRI hashes!');
}

// Run the script
updateReadmeWithSRI();