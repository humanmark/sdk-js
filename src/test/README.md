# Unit Test Structure

This directory contains unit tests for the Humanmark SDK, organized by functionality.

## Test Organization

```
test/
├── core/              # Core SDK functionality tests
│   ├── api-client.test.ts          # API client tests
│   ├── api-client-edge-cases.test.ts
│   ├── challenge-manager.test.ts   # Challenge management tests
│   ├── challenge.test.ts           # Challenge token tests
│   └── sdk.test.ts                 # Main SDK class tests
│
├── ui/                # UI component tests
│   ├── accessibility-manager.test.ts # Accessibility features
│   ├── deep-link-handler.test.ts   # Deep link handling
│   ├── modal-cancel.test.ts        # Modal cancellation behavior
│   ├── qr-code-generator.test.ts   # QR code generation
│   ├── svg-builder.test.ts         # SVG utilities
│   └── ui.test.ts                  # UI manager tests
│
├── utils/             # Utility function tests
│   ├── dom.test.ts                 # DOM manipulation utilities
│   ├── http.test.ts                # HTTP utilities
│   ├── lazy-loader.test.ts         # Lazy loading utilities
│   ├── retry.test.ts               # Retry logic tests
│   └── validation.test.ts          # Input validation tests
│
├── errors/            # Error handling tests
│   ├── error-factories.test.ts     # Error factory functions
│   └── humanmark-error.test.ts     # Custom error classes
│
├── integration/       # Integration and edge case tests
│   ├── deduplication.test.ts       # Request deduplication
│   ├── preload.test.ts            # Component preloading
│   └── sdk-edge-cases.test.ts    # SDK edge cases
│
├── setupTests.ts      # Test setup and configuration
└── utils/            # Test utilities (mocks, helpers)
    ├── test-utils.ts
    └── mock-fixtures.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/test/core/sdk.test.ts

# Run tests in a specific folder
npm test src/test/ui
```

## Writing Tests

### Test Structure

Each test file should follow this pattern:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentUnderTest } from '@/path/to/component';

describe('ComponentUnderTest', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = ComponentUnderTest.method(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Test Guidelines

1. **Use descriptive test names**: Test names should clearly describe what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Keep tests focused**: One test should verify one behavior
4. **Use appropriate matchers**: Use the most specific matcher for assertions
5. **Mock external dependencies**: Use `vi.mock()` for external modules
6. **Clean up after tests**: Reset mocks and DOM state in `afterEach`

### Common Test Utilities

- `mockApiResponse()`: Mock API responses
- `createMockToken()`: Create mock challenge tokens
- `waitForAsync()`: Wait for async operations
- `setupDOM()`: Set up DOM environment for UI tests

See `test/utils/test-utils.ts` for available utilities.
