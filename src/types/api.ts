/**
 * API Request and Response Types
 */

/**
 * Response from the wait endpoint when verification is complete
 */
export interface WaitResponse {
  /**
   * Receipt to be passed to your backend
   */
  receipt: string;
}

/**
 * Headers required for waiting on challenge completion
 */
export interface WaitChallengeHeaders {
  'hm-api-key': string;
}

/**
 * API request options
 */
export interface APIRequestOptions {
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Abort signal for request cancellation
   */
  signal?: AbortSignal;
}
