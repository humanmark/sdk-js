# Humanmark JavaScript SDK

A browser-native JavaScript SDK for integrating Humanmark human verification challenges into web applications.

## Features

- 🌐 **Browser-native**: No Node.js runtime dependencies
- 🔐 **Dual-mode operation**: Support for both create & verify mode and verify-only mode
- 📱 **Mobile-friendly**: Automatic detection and deep linking for mobile devices
- 🎯 **TypeScript support**: Full type definitions included
- 🔒 **Security-first**: CSP compliant, no eval() or innerHTML usage
- 📦 **Multiple formats**: ESM, UMD, and IIFE bundles available
- 🎨 **Theme support**: Dark, light, and auto themes with system preference detection
- 🛡️ **Safe integration**: Scoped styles and minimal DOM modifications prevent conflicts

## Installation

### NPM

```bash
npm install @humanmark/sdk-js
```

### CDN

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

### Create & Verify Mode

```javascript
const sdk = new HumanmarkSdk({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  domain: 'your-domain.com'
});

try {
  const token = await sdk.verify();
  // Send token to your backend for verification
  console.log('Verification token:', token);
} catch (error) {
  console.error('Verification failed:', error);
}
```

### Verify-Only Mode

```javascript
const sdk = new HumanmarkSdk({
  apiKey: 'your-api-key',
  challenge: 'pre-created-challenge-id',
  domain: 'your-domain.com'
});

try {
  const token = await sdk.verify();
  // Send token to your backend for verification
  console.log('Verification token:', token);
} catch (error) {
  console.error('Verification failed:', error);
}
```

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | string | Yes | Your Humanmark API key |
| `apiSecret` | string | Create & verify only | API secret for create & verify mode |
| `challenge` | string | Verify-only mode only | Pre-created challenge ID |
| `domain` | string | Yes | Your registered domain |
| `baseUrl` | string | No | Base URL for API requests (default: 'https://humanmark.io') |
| `theme` | 'light' \| 'dark' \| 'auto' | No | Modal theme (default: 'dark') |

## Error Handling

The SDK provides specific error types to help handle different scenarios:

```javascript
try {
  const token = await sdk.verify();
} catch (error) {
  if (error.name === 'HumanmarkVerificationCancelledError') {
    // User cancelled verification
    console.log('User cancelled verification');
  } else {
    // Other errors
    console.error('Verification failed:', error);
  }
}
```

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 13.1+
- Edge 80+

## Security

The SDK is designed with security best practices:
- CSP compliant
- No eval() or innerHTML usage
- HTTPS required
- SRI support for CDN usage

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://humanmark.dev
- Email: support@humanmark.dev
- Security issues: security@humanmark.dev