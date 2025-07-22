# Humanmark JavaScript SDK

A browser-native JavaScript SDK for integrating Humanmark human verification challenges into web applications.

## Features

- 🌐 **Browser-native**: No Node.js runtime dependencies
- 🔐 **Secure by design**: Pre-created challenge tokens only - never expose API secrets in client code
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
  if (error.name === 'HumanmarkVerificationCancelledError') {
    console.log('User cancelled verification');
  } else {
    console.error('Verification failed:', error);
  }
}
```

### Backend Integration

Your backend should create challenge tokens using your API key and secret:

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

## Error Handling

The SDK provides specific error types to help handle different scenarios:

```javascript
import { HumanmarkSdk, ErrorCode, isHumanmarkError } from '@humanmark/sdk-js';

try {
  const receipt = await sdk.verify();
} catch (error) {
  // Handle user cancellation
  if (error.name === 'HumanmarkVerificationCancelledError') {
    console.log('User cancelled verification');
    return;
  }
  
  // Handle specific Humanmark errors
  if (isHumanmarkError(error)) {
    switch (error.code) {
      case ErrorCode.CHALLENGE_EXPIRED:
        console.error('Challenge expired. Please try again.');
        break;
      case ErrorCode.NETWORK_ERROR:
        console.error('Network error. Please check your connection.');
        break;
      case ErrorCode.INVALID_API_KEY:
        console.error('Invalid API key.');
        break;
      default:
        console.error(`Verification failed: ${error.message}`);
    }
  }
}
```

## Theme Customization

```javascript
// Dark theme (default)
const sdk = new HumanmarkSdk({
  apiKey: 'your-api-key',
  challengeToken: 'your-challenge-token',
  theme: 'dark'
});

// Light theme
const sdk = new HumanmarkSdk({
  apiKey: 'your-api-key',
  challengeToken: 'your-challenge-token',
  theme: 'light'
});

// Auto theme (follows system preference)
const sdk = new HumanmarkSdk({
  apiKey: 'your-api-key',
  challengeToken: 'your-challenge-token',
  theme: 'auto'
});
```

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 13.1+
- Edge 80+

## Security

The SDK is designed with security best practices:
- Never expose API secrets in frontend code
- CSP compliant - no eval() or innerHTML usage
- HTTPS required for all API communications
- SRI support for CDN usage
- Scoped styles prevent CSS conflicts

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://docs.humanmark.io
- GitHub: https://github.com/humanmark/sdk-js
- Email: support@humanmark.dev
- Security issues: security@humanmark.dev