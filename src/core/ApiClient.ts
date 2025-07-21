import type {
  CreateChallengeRequest,
  CreateChallengeResponse,
  WaitResponse,
  CreateChallengeHeaders,
  WaitChallengeHeaders,
  APIRequestOptions,
} from '@/types/api';
import {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT,
  ENDPOINTS,
} from '@/constants/endpoints';
import {
  parseShardFromToken,
  parseChallengeFromToken,
  constructShardUrl,
} from '@/utils/challengeToken';
import { HumanmarkError, HumanmarkNetworkError } from '@/errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';
import {
  HTTP_STATUS,
  HTTP_METHODS,
  HTTP_HEADERS,
  CONTENT_TYPES,
} from '@/constants/http';
import { RETRY_CONFIG, TIMEOUT_CONFIG } from '@/constants/retry';
import {
  isRetryableStatus,
  isRetryableNetworkError,
  createFetchOptions,
  isOnline,
} from '@/utils/http';
import { calculateRetryDelay, delay } from '@/utils/retry';
import {
  createTimeoutError,
  createNetworkError,
  createApiErrorFromStatus,
} from '@/errors/factories';

// Extended AbortController interface for timeout tracking
interface AbortControllerWithTimeout extends AbortController {
  timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * HTTP client for Humanmark API communication
 *
 * Handles all network requests with built-in retry logic,
 * exponential backoff, and timeout protection.
 *
 * @internal This class is used internally by HumanmarkSdk
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private abortController: AbortController | null = null;

  /**
   * Creates a new ApiClient instance
   *
   * @param baseUrl - Base URL for API requests (default: https://humanmark.io)
   * @param timeout - Default timeout for requests in milliseconds (default: 30000)
   */
  constructor(
    baseUrl: string = DEFAULT_BASE_URL,
    timeout: number = DEFAULT_TIMEOUT
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Cancels any ongoing API requests
   */
  cancelPendingRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Creates a new verification challenge
   *
   * Implements retry logic with exponential backoff for resilience.
   * Will retry up to MAX_RETRIES times on:
   * - 5xx server errors
   * - 429 rate limit errors
   * - Network failures
   *
   * @param request - Challenge creation request data
   * @param headers - Required API headers including api key and secret
   * @param options - Optional request configuration
   * @returns Promise resolving to challenge details
   * @throws {Error} On non-retryable errors or after max retries
   */
  async createChallenge(
    request: CreateChallengeRequest,
    headers: CreateChallengeHeaders,
    options?: APIRequestOptions
  ): Promise<CreateChallengeResponse> {
    this.abortController = options?.signal
      ? new AbortController()
      : new AbortController();

    // Link external abort signal if provided
    if (options?.signal) {
      const abortHandler = (): void => this.abortController?.abort();
      options.signal.addEventListener('abort', abortHandler, { once: true });
    }

    const startTime = Date.now();
    const timeout =
      options?.timeout ?? TIMEOUT_CONFIG.CREATE_CHALLENGE_TOTAL_MS;

    for (let attempt = 0; attempt < RETRY_CONFIG.MAX_RETRIES; attempt++) {
      try {
        // Pre-request checks
        const remainingTime = this.performPreRequestChecks(startTime, timeout);

        // Wait before retry (except first attempt)
        if (attempt > 0) {
          await this.waitForRetry(attempt, startTime, timeout);
        }

        // Make the request
        const requestTimeout = Math.min(this.timeout, remainingTime);
        const response = await this.makeRequest(
          `${this.baseUrl}${ENDPOINTS.CREATE_CHALLENGE}`,
          createFetchOptions(
            HTTP_METHODS.POST,
            {
              [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
              [HTTP_HEADERS.API_KEY]: headers[HTTP_HEADERS.API_KEY],
              [HTTP_HEADERS.API_SECRET]: headers[HTTP_HEADERS.API_SECRET],
            },
            request
          ),
          requestTimeout
        );

        if (response.ok) {
          return await this.parseJsonResponse<CreateChallengeResponse>(
            response
          );
        }

        // Check if we should retry this error
        if (
          !isRetryableStatus(response.status) ||
          attempt === RETRY_CONFIG.MAX_RETRIES - 1
        ) {
          this.handleResponseError(response);
        }

        // Otherwise, continue to next retry attempt
      } catch (error) {
        // Check if we should retry
        if (!this.shouldRetryError(error, attempt, startTime, timeout)) {
          throw this.mapNetworkError(error);
        }
        // Continue to next retry attempt
      }
    }

    // Should never reach here
    throw new HumanmarkNetworkError(
      'Request failed after retries',
      ErrorCode.NETWORK_ERROR
    );
  }

  /**
   * Waits for challenge completion using long polling
   *
   * Continuously polls the server until:
   * - User completes verification (returns receipt)
   * - Challenge expires (410 status)
   * - Timeout is reached
   *
   * @param token - Challenge token containing shard and challenge
   * @param headers - Required API headers including api key
   * @param options - Optional request configuration
   * @returns Promise resolving to verification response with receipt
   * @throws {Error} On challenge expiry, timeout, or other errors
   */
  async waitForChallengeToken(
    token: string,
    headers: WaitChallengeHeaders,
    options?: APIRequestOptions
  ): Promise<WaitResponse> {
    this.abortController = options?.signal
      ? new AbortController()
      : new AbortController();

    // Link external abort signal if provided
    if (options?.signal) {
      const abortHandler = (): void => this.abortController?.abort();
      options.signal.addEventListener('abort', abortHandler, { once: true });
    }

    try {
      const startTime = Date.now();
      const timeout =
        options?.timeout ?? TIMEOUT_CONFIG.WAIT_CHALLENGE_TOTAL_MS;
      const shard = parseShardFromToken(token);
      const challenge = parseChallengeFromToken(token);
      const shardUrl = constructShardUrl(this.baseUrl, shard);

      let retryCount = 0;

      while (true) {
        try {
          // Pre-request checks
          const remainingTime = this.performPreRequestChecks(
            startTime,
            timeout
          );

          // Wait before retry (except first attempt and after 408s)
          if (retryCount > 0) {
            await this.waitForRetry(retryCount, startTime, timeout);
          }

          // Make the request
          const requestTimeout = Math.min(
            remainingTime,
            TIMEOUT_CONFIG.SINGLE_REQUEST_MS
          );
          const response = await this.makeRequest(
            `${shardUrl}${ENDPOINTS.WAIT_CHALLENGE}/${challenge}`,
            createFetchOptions(HTTP_METHODS.GET, {
              [HTTP_HEADERS.API_KEY]: headers[HTTP_HEADERS.API_KEY],
            }),
            requestTimeout
          );

          // Handle different response statuses
          const result = await this.handleWaitResponse(response);
          if (result === 'retry') {
            retryCount = 0; // Reset for 408s
            continue;
          }
          return result;
        } catch (error) {
          // Check if we should retry
          if (!this.shouldRetryError(error, retryCount, startTime, timeout)) {
            throw this.mapNetworkError(error);
          }

          // Increment retry count for network errors
          retryCount++;
        }
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Checks if the request has been cancelled
   * @throws {HumanmarkNetworkError} If request was cancelled
   */
  private checkCancellation(): void {
    if (this.abortController?.signal.aborted) {
      throw createNetworkError(
        new DOMException('Request cancelled', 'AbortError')
      );
    }
  }

  /**
   * Checks if we've exceeded the maximum time allowed
   * @throws {HumanmarkNetworkError} If timeout exceeded
   */
  private checkTimeout(startTime: number, maxTotalTime: number): number {
    const elapsedTime = Date.now() - startTime;
    const remainingTime = maxTotalTime - elapsedTime;

    if (remainingTime <= 0) {
      throw createTimeoutError('Client request');
    }

    return remainingTime;
  }

  /**
   * Waits before retrying with logging
   */
  private async waitForRetry(
    attempt: number,
    startTime: number,
    maxTotalTime: number
  ): Promise<void> {
    const retryDelay = calculateRetryDelay(attempt);
    const elapsedTime = Date.now() - startTime;

    // Don't wait if it would exceed our time limit
    if (retryDelay > 0 && retryDelay + elapsedTime > maxTotalTime) {
      throw createTimeoutError('Client request');
    }

    if (retryDelay > 0) {
      await delay(retryDelay, this.abortController?.signal);
    }
  }

  /**
   * Creates an abort controller linked to the main controller
   */
  private createLinkedAbortController(
    timeout: number
  ): AbortControllerWithTimeout {
    const controller = new AbortController() as AbortControllerWithTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Link to main abort controller
    const mainAbortHandler = (): void => controller.abort();
    this.abortController?.signal.addEventListener('abort', mainAbortHandler, {
      once: true,
    });

    // Store timeout ID for cleanup
    controller.timeoutId = timeoutId;

    return controller;
  }

  /**
   * Handles wait response and determines if retry is needed
   */
  private async handleWaitResponse(
    response: Response
  ): Promise<WaitResponse | 'retry'> {
    // Handle 408 (expected server timeout) - retry immediately
    if (response.status === HTTP_STATUS.REQUEST_TIMEOUT) {
      return 'retry';
    }

    // Handle success
    if (response.ok) {
      return await this.parseJsonResponse<WaitResponse>(response);
    }

    // Handle errors - these don't retry
    this.handleResponseError(response);
  }

  /**
   * Makes a request with timeout and cancellation support
   */
  private async makeRequest(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = this.createLinkedAbortController(timeout);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(controller.timeoutId);
    }
  }

  /**
   * Performs pre-request validation checks
   */
  private performPreRequestChecks(startTime: number, maxTime: number): number {
    this.checkCancellation();

    // Check if we're online before attempting request
    if (!isOnline()) {
      throw new HumanmarkNetworkError(
        'No internet connection',
        ErrorCode.NETWORK_ERROR,
        undefined,
        {
          isTemporary: true,
          errorCategory: 'temporary',
        }
      );
    }

    return this.checkTimeout(startTime, maxTime);
  }

  /**
   * Handles retry logic for network errors
   */
  private shouldRetryError(
    error: unknown,
    attempt: number,
    startTime: number,
    maxTime: number
  ): boolean {
    if (error instanceof HumanmarkError) {
      // Check if it's a temporary network error
      if (error instanceof HumanmarkNetworkError && error.isTemporary) {
        const elapsedTime = Date.now() - startTime;
        return elapsedTime < maxTime && attempt < RETRY_CONFIG.MAX_RETRIES - 1;
      }
      return false;
    }

    const elapsedTime = Date.now() - startTime;
    return (
      elapsedTime < maxTime &&
      attempt < RETRY_CONFIG.MAX_RETRIES - 1 &&
      isRetryableNetworkError(error)
    );
  }

  /**
   * Maps errors to appropriate Humanmark error types
   */
  private mapNetworkError(error: unknown): Error {
    if (error instanceof HumanmarkError) {
      return error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return createTimeoutError();
    }

    return createNetworkError(error);
  }

  /**
   * Handles response errors with appropriate error codes
   */
  private handleResponseError(response: Response): never {
    throw createApiErrorFromStatus(response.status, response.statusText);
  }

  /**
   * Parses JSON response safely
   */
  private async parseJsonResponse<T>(response: Response): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      throw new HumanmarkNetworkError(
        'Invalid JSON response from server',
        ErrorCode.INVALID_RESPONSE,
        response.status
      );
    }
  }
}
