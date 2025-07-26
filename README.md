<img src="./LogoWordmarkLightBG.svg" width="300" alt="Humanmark Logo">

![npm version](https://img.shields.io/npm/v/@humanmark/sdk-js/beta.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@humanmark/sdk-js)
![npm downloads](https://img.shields.io/npm/dm/@humanmark/sdk-js.svg)

# Humanmark JavaScript SDK

A browser-native JavaScript SDK for integrating Humanmark human verification challenges into web applications. Complete documentation can be found at https://humanmark.dev.

> **Beta Notice:** Humanmark SDK is currently in beta. While the API is stable, minor changes may occur before the 1.0 release. To get started, email sales@humanmark.io for API credentials.

## What is Humanmark?

Humanmark is a privacy-first human verification service that helps protect your applications from automation and automated abuse. Unlike traditional CAPTCHAs, Humanmark provides a seamless verification experience through mobile app integration - users simply tap a button on their phone to prove they're human.

This SDK enables you to integrate Humanmark verification into your web applications with just a few lines of code. When verification is needed, users see a QR code (on desktop) or a button (on mobile) that connects to the Humanmark mobile app for instant, frictionless verification.

## Why Humanmark?

- **Real Privacy** - We verify users are human, not who they are. No behavior tracking, no personal data collection, no profiles.
- **Actually Works** - CAPTCHAs don't work anymore. AI solves them faster than humans. Humanmark uses device security that AI can't fake.
- **User Friendly** - No puzzles to solve or distorted text to decipher. Just a quick tap using their phone's built-in security.
- **Developer Friendly** - Simple integration, comprehensive TypeScript support, and no complex backend infrastructure needed.

## Features

- **Zero Backend Dependencies** - Pure browser JavaScript with no Node.js requirements
- **Secure Architecture** - Pre-created challenge tokens prevent API secret exposure in client code  
- **TypeScript Native** - Full type definitions with strict mode for enhanced developer experience
- **Universal Compatibility** - ESM, UMD, and IIFE bundles for any JavaScript environment
- **Mobile Optimized** - Automatic device detection with native app deep linking
- **Privacy by Design** - No user data collection, no cookies, no tracking
- **Minimal Footprint** - ~21KB gzipped with lazy loading and code splitting for optimal performance
- **Theme Flexibility** - Dark, light, and auto themes that respect system preferences

## Prerequisites

- **HTTPS Required** - The SDK requires your site to be served over HTTPS for security
- **Modern Browser** - See [Browser Support](#browser-support) section for minimum versions
- **API Credentials** - Currently in beta, email sales@humanmark.io to get started

## Installation

### NPM

```bash
npm install @humanmark/sdk-js
```

### CDN

Use our pre-built bundles from a CDN with Subresource Integrity (SRI) for security. The SRI hashes shown below are automatically updated for each published version:

```html
<!-- Browser bundle (IIFE) -->
<script 
  src="https://cdn.jsdelivr.net/npm/@humanmark/sdk-js@latest/dist/browser/index.js" 
  crossorigin="anonymous">
</script>

<!-- Or UMD bundle -->
<script 
  src="https://cdn.jsdelivr.net/npm/@humanmark/sdk-js@latest/dist/umd/index.js" 
  crossorigin="anonymous">
</script>
```

## Quick Start

The SDK requires a pre-created challenge token from your backend:

```javascript
// 1. Get challenge token from your backend
const response = await fetch('/api/create-challenge');
const { challengeToken } = await response.json();

// 2. Initialize the SDK
const sdk = new HumanmarkSdk({
  apiKey: 'your-api-key',
  challengeToken: challengeToken
});

// 3. Start verification
try {
  const receipt = await sdk.verify();
  // Send receipt to your backend for verification
  console.log('Receipt:', receipt);
} catch (error) {
  if (error.code === 'USER_CANCELLED') {
    console.log('User cancelled verification');
  } else {
    console.error('Verification failed:', error);
  }
}
```

### Backend Integration

Your backend should create challenge tokens using your API key and secret. For complete integration examples, see our [Getting Started Guide](https://humanmark.dev/getting-started).

```javascript
// Backend example (Node.js)
app.post('/api/create-challenge', async (req, res) => {
  const response = await fetch('https://humanmark.io/api/v1/challenge/create', {
    method: 'POST',
    headers: {
      'hm-api-key': API_KEY,
      'hm-api-secret': API_SECRET,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ domain: 'your-domain.com' })
  });
  
  const { token } = await response.json();
  res.json({ challengeToken: token });
});
```

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | string | Yes | Your Humanmark API key |
| `challengeToken` | string | Yes | Pre-created challenge token from your backend |
| `baseUrl` | string | No | Base URL for API requests (default: 'https://humanmark.io') |
| `theme` | 'light' \| 'dark' \| 'auto' | No | Modal theme (default: 'dark'). 'auto' follows system preference |

For a complete API reference, visit [https://humanmark.dev/api](https://humanmark.dev/api).

## Error Handling

The SDK provides specific error codes to help handle different scenarios:

```javascript
import { HumanmarkSdk, ErrorCode, isHumanmarkError } from '@humanmark/sdk-js';

try {
  const receipt = await sdk.verify();
} catch (error) {
  // Handle specific error codes
  if (isHumanmarkError(error)) {
    switch (error.code) {
      case ErrorCode.USER_CANCELLED:
        console.log('User cancelled verification');
        return;
      case ErrorCode.CHALLENGE_EXPIRED:
        console.error('Challenge expired. Please try again.');
        break;
      default:
        console.error(`Verification failed: ${error.message}`);
    }
  }
}
```

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 13.1+
- Edge 80+

## Security

The SDK implements defense-in-depth security principles to protect your application and users:

**Token-Based Architecture** - The SDK requires pre-created challenge tokens from your backend, ensuring API secrets never leave your server. This prevents credential exposure in client-side code.

**Content Security Policy (CSP) Compliance** - No use of `eval()`, `innerHTML`, or other dynamic code execution. The SDK works seamlessly with strict CSP policies.

**Network Security** - All API communications require HTTPS. The SDK includes built-in timeout protection and validates all server responses.

**Subresource Integrity (SRI)** - When using CDN delivery, SRI hashes are automatically generated for each release to prevent tampering.

**DOM Isolation** - All styles are scoped to prevent CSS conflicts. The SDK makes minimal DOM modifications and properly cleans up all elements and event listeners.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://humanmark.dev
- GitHub: https://github.com/humanmark/sdk-js
- Email: support@humanmark.io
- Security issues: security@humanmark.io