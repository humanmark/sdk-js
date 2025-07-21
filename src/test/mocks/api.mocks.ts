import type {
  CreateChallengeResponse,
  WaitResponse,
  CreateChallengeRequest,
  CreateChallengeHeaders,
  WaitChallengeHeaders,
} from '@/types/api';
import { createMockToken } from '../utils/test-helpers';

// Mock responses
export const mockChallengeResponse: CreateChallengeResponse = {
  token: createMockToken({
    shard: 'us-east-1',
    challenge: 'testChallenge123ABC',
    exp: Math.floor((Date.now() + 300000) / 1000), // 5 minutes from now
  }),
};

export const mockWaitResponse: WaitResponse = {
  receipt: 'test-receipt-abc123',
};

// Mock request data
export const mockCreateRequest: CreateChallengeRequest = {
  domain: 'test.example.com',
};

export const mockCreateHeaders: CreateChallengeHeaders = {
  'hm-api-key': 'test-api-key',
  'hm-api-secret': 'test-api-secret',
};

export const mockWaitHeaders: WaitChallengeHeaders = {
  'hm-api-key': 'test-api-key',
};

// Mock response builders
export function createMockResponse(
  body: unknown,
  init?: ResponseInit
): Response {
  const defaultInit: ResponseInit = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  };

  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    ...defaultInit,
    ...init,
  });
}

export function createErrorResponse(
  status: number,
  statusText?: string
): Response {
  return new Response(null, {
    status,
    statusText: statusText ?? getDefaultStatusText(status),
  });
}

function getDefaultStatusText(status: number): string {
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
  return statusTexts[status] ?? 'Unknown Error';
}

// Common fetch mock scenarios
export const fetchMockScenarios = {
  success: {
    createChallenge: (): Response => createMockResponse(mockChallengeResponse),
    waitChallenge: (): Response => createMockResponse(mockWaitResponse),
  },

  errors: {
    serverError: (): Response => createErrorResponse(500),
    rateLimit: (): Response => createErrorResponse(429),
    timeout: (): Response => createErrorResponse(408),
    expired: (): Response => createErrorResponse(410),
    badRequest: (): Response => createErrorResponse(400),
    unauthorized: (): Response => createErrorResponse(401),
    networkError: (): Promise<never> =>
      Promise.reject(new TypeError('Failed to fetch')),
    abortError: (): Promise<never> =>
      Promise.reject(
        new DOMException('The operation was aborted', 'AbortError')
      ),
  },

  invalid: {
    jsonError: (): Response =>
      createMockResponse('invalid json', { status: 200 }),
    emptyResponse: (): Response => createMockResponse('', { status: 200 }),
  },
};

// Test data generators
export function createMockChallenge(
  overrides?: Partial<CreateChallengeResponse>
): CreateChallengeResponse {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return {
    token:
      overrides?.token ??
      createMockToken({
        shard: 'us-east-1',
        challenge: `${timestamp}${random}`,
        exp: Math.floor((Date.now() + 300000) / 1000),
      }),
    ...overrides,
  };
}

export function createMockWaitResponse(
  overrides?: Partial<WaitResponse>
): WaitResponse {
  return {
    receipt: `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    ...overrides,
  };
}
