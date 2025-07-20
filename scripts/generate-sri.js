#!/usr/bin/env node

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Files to generate SRI hashes for
const FILES_TO_HASH = [
  'dist/browser/index.js',
  'dist/esm/index.js',
  'dist/umd/index.js',
];

// Generate SRI hash for a file
function generateSRIHash(filePath, algorithm = 'sha384') {
  try {
    const content = readFileSync(filePath);
    const hash = createHash(algorithm).update(content).digest('base64');
    return `${algorithm}-${hash}`;
  } catch (error) {
    console.error(`Error generating SRI hash for ${filePath}:`, error.message);
    return null;
  }
}

// Main function
function generateSRIManifest() {
  console.log('Generating SRI hashes for built files...\n');
  
  const manifest = {
    version: process.env.npm_package_version || 'unknown',
    generated: new Date().toISOString(),
    hashes: {},
    usage: {}
  };

  FILES_TO_HASH.forEach(file => {
    const fullPath = join(rootDir, file);
    
    if (!existsSync(fullPath)) {
      console.warn(`⚠️  File not found: ${file}`);
      return;
    }

    const hash = generateSRIHash(fullPath);
    if (hash) {
      manifest.hashes[file] = hash;
      console.log(`✅ ${file}`);
      console.log(`   ${hash}\n`);
      
      // Generate usage example
      const fileName = file.split('/').pop();
      const cdnUrl = `https://cdn.jsdelivr.net/npm/@humanmark/sdk-js@${manifest.version}/${file}`;
      manifest.usage[file] = {
        cdn: {
          jsdelivr: cdnUrl,
          unpkg: `https://unpkg.com/@humanmark/sdk-js@${manifest.version}/${file}`
        },
        html: `<script src="${cdnUrl}" integrity="${hash}" crossorigin="anonymous"></script>`
      };
    }
  });

  // Write manifest file
  const manifestPath = join(rootDir, 'dist', 'sri-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📄 SRI manifest written to: dist/sri-manifest.json`);

  // Generate markdown documentation
  const mdContent = generateMarkdownDoc(manifest);
  const mdPath = join(rootDir, 'dist', 'SRI-HASHES.md');
  writeFileSync(mdPath, mdContent);
  console.log(`📝 SRI documentation written to: dist/SRI-HASHES.md`);
}

// Generate markdown documentation
function generateMarkdownDoc(manifest) {
  let md = `# Subresource Integrity (SRI) Hashes

Generated: ${manifest.generated}  
Version: ${manifest.version}

## What is SRI?

Subresource Integrity (SRI) is a security feature that enables browsers to verify that resources they fetch haven't been tampered with. Use these hashes when loading the Humanmark SDK from a CDN.

## Usage Examples

### Browser Bundle (IIFE)

\`\`\`html
${manifest.usage['dist/browser/index.js']?.html || '<!-- Bundle not found -->'}
\`\`\`

### UMD Bundle

\`\`\`html
${manifest.usage['dist/umd/index.js']?.html || '<!-- Bundle not found -->'}
\`\`\`

### ES Module

For ES modules, use with \`<script type="module">\`:

\`\`\`html
<script type="module">
  import { HumanmarkSdk } from '${manifest.usage['dist/esm/index.js']?.cdn.jsdelivr || ''}';
  // Your code here
</script>
\`\`\`

## Hash Values

| File | SRI Hash |
|------|----------|
`;

  Object.entries(manifest.hashes).forEach(([file, hash]) => {
    md += `| \`${file}\` | \`${hash}\` |\n`;
  });

  md += `\n## Security Notes

1. Always use HTTPS when loading resources
2. Include the \`crossorigin="anonymous"\` attribute
3. Verify the integrity hash matches the version you intend to use
4. These hashes are specific to version ${manifest.version}

## CDN URLs

### jsDelivr

- Browser: \`https://cdn.jsdelivr.net/npm/@humanmark/sdk-js@${manifest.version}/dist/browser/index.js\`
- UMD: \`https://cdn.jsdelivr.net/npm/@humanmark/sdk-js@${manifest.version}/dist/umd/index.js\`
- ESM: \`https://cdn.jsdelivr.net/npm/@humanmark/sdk-js@${manifest.version}/dist/esm/index.js\`

### unpkg

- Browser: \`https://unpkg.com/@humanmark/sdk-js@${manifest.version}/dist/browser/index.js\`
- UMD: \`https://unpkg.com/@humanmark/sdk-js@${manifest.version}/dist/umd/index.js\`
- ESM: \`https://unpkg.com/@humanmark/sdk-js@${manifest.version}/dist/esm/index.js\`
`;

  return md;
}

// Run the script
generateSRIManifest();