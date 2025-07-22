/**
 * HTTP utility functions
 * Helper functions for HTTP operations and status checking
 */

import { HTTP_STATUS } from '@/constants/http';

/**
 * Checks if an HTTP status code indicates a server error
 * @param status - HTTP status code
 * @returns true if status is 5xx
 */
export function isServerError(status: number): boolean {
  return status >= HTTP_STATUS.INTERNAL_SERVER_ERROR && status < 600;
}

/**
 * Checks if an HTTP status code indicates the request should be retried
 * @param status - HTTP status code
 * @returns true if the request should be retried
 */
export function isRetryableStatus(status: number): boolean {
  return isServerError(status) || status === HTTP_STATUS.TOO_MANY_REQUESTS;
}

/**
 * Checks if an HTTP status code indicates an API key error
 * @param status - HTTP status code
 * @returns true if status is 401 or 403
 */
export function isApiKeyError(status: number): boolean {
  return (
    status === HTTP_STATUS.UNAUTHORIZED || status === HTTP_STATUS.FORBIDDEN
  );
}

/**
 * Checks if an error is a network error that can be retried
 * @param error - The error to check
 * @returns true if the error is retryable
 */
export function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // AbortError should NOT be retryable - it means we intentionally cancelled
  if (error.name === 'AbortError') return false;

  return (
    error.name === 'TypeError' ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('Network request failed') ||
    error.message?.includes('ERR_NETWORK') ||
    error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ETIMEDOUT') ||
    error.message?.includes('ENOTFOUND')
  );
}

/**
 * Categorizes a network error as temporary or permanent
 * @param error - The error to categorize
 * @returns 'temporary' | 'permanent' | 'unknown'
 */
export function categorizeNetworkError(
  error: unknown
): 'temporary' | 'permanent' | 'unknown' {
  if (!(error instanceof Error)) return 'unknown';

  // User cancelled - permanent
  if (error.name === 'AbortError') return 'permanent';

  // Network connectivity issues - temporary
  if (
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('Network request failed') ||
    error.message?.includes('ERR_NETWORK') ||
    error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ETIMEDOUT') ||
    error.message?.includes('ENOTFOUND')
  ) {
    return 'temporary';
  }

  // SSL/TLS errors - permanent
  if (
    error.message?.includes('ERR_CERT') ||
    error.message?.includes('SSL') ||
    error.message?.includes('TLS')
  ) {
    return 'permanent';
  }

  // CORS errors - permanent configuration issue
  if (error.message?.includes('CORS')) {
    return 'permanent';
  }

  return 'unknown';
}

/**
 * Creates a fetch options object with common settings
 * @param method - HTTP method
 * @param headers - Headers object
 * @param body - Optional request body
 * @param signal - Optional abort signal
 * @returns Fetch options object
 */
export function createFetchOptions(
  method: string,
  headers: Record<string, string>,
  body?: unknown,
  signal?: AbortSignal
): RequestInit {
  const options: RequestInit = {
    method,
    headers,
  };

  if (signal) {
    options.signal = signal;
  }

  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return options;
}

/**
 * Safely extracts error message from unknown error
 * @param error - The error to extract message from
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Checks if the browser is online
 * @returns true if online, false if offline
 */
export function isOnline(): boolean {
  // navigator.onLine is supported in all modern browsers
  // Returns false if definitely offline, true if possibly online
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
