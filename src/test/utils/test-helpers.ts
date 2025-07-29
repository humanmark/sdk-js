/**
 * Test Helper Utilities
 * Common utilities for test setup, teardown, and assertions
 */

import { vi, expect, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type { ChallengeTokenClaims } from '@/utils/challengeToken';

/**
 * Sets up a mock fetch environment for testing
 * @returns Object with mock fetch and cleanup function
 */
export function setupMockFetch(): { mockFetch: Mock; cleanup: () => void } {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;
  global.fetch = mockFetch;

  return {
    mockFetch,
    cleanup: (): void => {
      global.fetch = originalFetch;
      mockFetch.mockClear();
    },
  };
}

/**
 * Cleans up all Humanmark-related DOM elements
 */
export function cleanupDOM(): void {
  // Remove all elements with humanmark IDs
  const humanmarkElements = document.querySelectorAll('[id^="humanmark-"]');
  humanmarkElements.forEach(element => element.remove());

  // Remove body class
  document.body.classList.remove('humanmark-modal-open');
}

/**
 * Mocks the user agent for device detection tests
 * @param deviceType - Type of device to mock
 */
export function mockUserAgent(
  deviceType: 'desktop' | 'mobile' | 'tablet'
): void {
  const userAgents = {
    desktop:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    mobile:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    tablet:
      'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  };

  Object.defineProperty(navigator, 'userAgent', {
    value: userAgents[deviceType],
    writable: true,
    configurable: true,
  });
}

/**
 * Waits for the verification modal to appear in the DOM
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise resolving to the modal element or null
 */
export async function waitForModal(timeout = 500): Promise<HTMLElement | null> {
  const pollInterval = 20; // Check every 20ms
  const maxAttempts = timeout / pollInterval;

  for (let i = 0; i < maxAttempts; i++) {
    const modal = document.getElementById('humanmark-verification-modal');
    if (modal) {
      return modal;
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return null;
}

/**
 * Creates a standardized API response mock
 * @param data - Response data
 * @param options - Additional response options
 */
export function createMockResponse<T>(
  data: T,
  options: Partial<Response> = {}
): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(data),
    ...options,
  } as Response;
}

/**
 * Creates a standardized error response mock
 * @param status - HTTP status code
 * @param statusText - Status text
 */
export function createMockErrorResponse(
  status: number,
  statusText?: string
): Response {
  const statusTexts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    408: 'Request Timeout',
    410: 'Gone',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return {
    ok: false,
    status,
    statusText: statusText ?? statusTexts[status] ?? 'Error',
    json: () => Promise.resolve({ error: statusText ?? statusTexts[status] }),
  } as Response;
}

/**
 * Asserts that an API call was made with expected parameters
 * @param mockFetch - The mock fetch function
 * @param callIndex - Which call to check (1-based)
 * @param expectedUrl - Expected URL
 * @param expectedOptions - Expected request options
 */
export function expectApiCall(
  mockFetch: ReturnType<typeof vi.fn>,
  callIndex: number,
  expectedUrl: string,
  expectedOptions?: Partial<RequestInit>
): void {
  expect(mockFetch).toHaveBeenNthCalledWith(
    callIndex,
    expectedUrl,
    expectedOptions
      ? expect.objectContaining(expectedOptions)
      : expect.any(Object)
  );
}

/**
 * Creates a mock challenge token for testing
 * @param claims - Optional override claims
 * @returns Mock token string in Protobuf format
 */
export function createMockToken(
  claims: Partial<ChallengeTokenClaims> = {}
): string {
  const defaultClaims: ChallengeTokenClaims = {
    shard: 'us-east-1',
    challenge: 'testChallenge123',
    exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
    iat: Math.floor(Date.now() / 1000),
    ...claims,
  };

  // For testing, we'll create a simplified mock that simulates a Protobuf token
  // In production, this would be a properly serialized Protobuf
  // This is a workaround since we can't easily create real Protobufs in tests

  // Create a mock payload that our test parser can handle
  // Note: This is NOT a real Protobuf - just for testing
  const mockPayload = btoa(
    JSON.stringify({
      ...defaultClaims,
      // Use snake_case field names to match Protobuf format
      expires_at: defaultClaims.exp,
      issued_at: defaultClaims.iat,
    })
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const signature = 'mock-signature';

  return `${mockPayload}.${signature}`;
}

/**
 * Setup and teardown helper for test suites
 * Automatically handles common setup/teardown tasks
 */
export function setupTestSuite(): { mockFetch: Mock; cleanup: () => void } {
  const mockEnv = setupMockFetch();

  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupDOM();
    vi.restoreAllMocks();
  });

  return mockEnv;
}
