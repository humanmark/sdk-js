/**
 * Challenge-related types
 */

/**
 * Challenge status from the API
 */
export type ChallengeStatus = 'pending' | 'completed' | 'expired' | 'failed';

/**
 * Challenge metadata stored in memory
 */
export interface ChallengeMetadata {
  /**
   * Challenge token (Protobuf format)
   */
  token: string;

  /**
   * Extracted challenge ID
   */
  challengeId: string;

  /**
   * Shard/region for the challenge
   */
  shard: string;

  /**
   * When the challenge was created
   */
  createdAt: Date;

  /**
   * When the challenge expires
   */
  expiresAt: Date;

  /**
   * Current status of the challenge
   */
  status: ChallengeStatus;

  /**
   * Domain associated with the challenge
   */
  domain: string;

  /**
   * Verification token (if completed)
   */
  verificationToken?: string;
}

/**
 * Options for creating a challenge
 */
export interface CreateChallengeOptions {
  /**
   * Domain for the challenge
   */
  domain: string;

  /**
   * Optional metadata to associate with the challenge
   */
  metadata?: Record<string, unknown>;
}

/**
 * Result of challenge creation
 */
export interface ChallengeCreationResult {
  /**
   * The created challenge token
   */
  token: string;

  /**
   * Extracted challenge metadata
   */
  metadata: ChallengeMetadata;
}

/**
 * Options for waiting on a challenge
 */
export interface WaitForChallengeOptions {
  /**
   * Challenge token to wait for
   */
  token: string;

  /**
   * Polling interval in milliseconds
   * @default 1000
   */
  pollingInterval?: number;

  /**
   * Maximum time to wait in milliseconds
   * @default 300000 (5 minutes)
   */
  timeout?: number;

  /**
   * Abort signal for cancellation
   */
  signal?: AbortSignal;
}

/**
 * Challenge manager interface
 */
export interface IChallengeManager {
  /**
   * Set the current challenge token
   */
  setChallengeToken(token: string): void;

  /**
   * Get the current challenge token if valid
   */
  getCurrentToken(): string | null;

  /**
   * Check if the current challenge token has expired
   */
  isExpired(): boolean;

  /**
   * Get remaining time until challenge expires
   */
  getTimeRemaining(): number;

  /**
   * Clear the stored challenge token
   */
  clearChallengeToken(): void;
}
