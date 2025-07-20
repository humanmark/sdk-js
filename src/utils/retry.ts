/**
 * Retry utility functions
 * Helper functions for implementing retry logic with exponential backoff
 */

import { RETRY_CONFIG } from '@/constants/retry';

/**
 * Calculates the retry delay with exponential backoff and jitter
 * @param attempt - The current attempt number (0-based)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(attempt: number): number {
  const baseDelay =
    RETRY_CONFIG.INITIAL_DELAY_MS *
    Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt);

  // Add random jitter to prevent thundering herd
  const jitter =
    baseDelay * RETRY_CONFIG.JITTER_FACTOR * (Math.random() * 2 - 1);

  return Math.max(0, baseDelay + jitter);
}

/**
 * Creates a cancellable delay promise
 * @param ms - Delay in milliseconds
 * @param signal - Optional abort signal
 * @returns Promise that resolves after delay or rejects if cancelled
 */
export async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    const abortHandler = (): void => {
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', abortHandler, { once: true });
  });
}

/**
 * Checks if we should continue retrying based on time and attempt limits
 * @param attempt - Current attempt number
 * @param startTime - When the operation started
 * @param maxTime - Maximum total time allowed
 * @param maxAttempts - Maximum number of attempts
 * @returns true if we should continue retrying
 */
export function shouldRetry(
  attempt: number,
  startTime: number,
  maxTime: number,
  maxAttempts: number = RETRY_CONFIG.MAX_RETRIES
): boolean {
  if (attempt >= maxAttempts) {
    return false;
  }

  const elapsedTime = Date.now() - startTime;
  return elapsedTime < maxTime;
}
