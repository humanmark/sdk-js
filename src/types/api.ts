/**
 * API Request and Response Types
 */

/**
 * Request body for creating a new challenge
 */
export interface CreateChallengeRequest {
  /**
   * Domain for which the challenge is being created
   */
  domain: string;
}

/**
 * Response from challenge creation endpoint
 */
export interface CreateChallengeResponse {
  /**
   * Challenge token in Protobuf format
   * Contains shard, challenge ID, and expiration data
   */
  token: string;
}

/**
 * Response from the wait endpoint when verification is complete
 */
export interface WaitResponse {
  /**
   * Verification token to be passed to your backend
   */
  token: string;
}

/**
 * Headers required for challenge creation
 */
export interface CreateChallengeHeaders {
  'hm-api-key': string;
  'hm-api-secret': string;
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
