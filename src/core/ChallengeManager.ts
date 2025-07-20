import {
  parseChallengeToken,
  getTokenExpiration,
  isTokenExpired,
} from '@/utils/challengeToken';
import type { IChallengeManager } from '@/types/challenge';
import { SPECIAL_VALUES } from '@/constants/retry';
import { createInvalidChallengeError } from '@/errors/factories';

/**
 * Manages challenge token lifecycle and storage
 *
 * Handles challenge token storage in memory with automatic expiration.
 * Does not use localStorage or any persistent storage for security.
 *
 * @internal This class is used internally by HumanmarkSdk
 */
export class ChallengeManager implements IChallengeManager {
  private token: string | null = null;

  /**
   * Stores a challenge token
   *
   * @param token - Challenge token to store
   * @throws {HumanmarkChallengeError} If the token is invalid
   */
  setChallengeToken(token: string): void {
    // Validate token by attempting to parse it
    try {
      parseChallengeToken(token);
    } catch {
      throw createInvalidChallengeError(token);
    }
    this.token = token;
  }

  /**
   * Retrieves the current challenge token if valid
   *
   * Automatically returns null for expired tokens.
   *
   * @returns Current challenge token or null if none exists or expired
   */
  getCurrentToken(): string | null {
    if (!this.token || this.isExpired()) {
      return null;
    }
    return this.token;
  }

  /**
   * Checks if the current challenge token has expired
   *
   * @returns true if expired or no token, false if valid
   */
  isExpired(): boolean {
    if (!this.token) {
      return true;
    }
    try {
      return isTokenExpired(this.token);
    } catch {
      // If token is invalid, treat as expired
      return true;
    }
  }

  /**
   * Gets remaining time until challenge token expires
   *
   * @returns Milliseconds until expiry, 0 if expired, -1 if no token
   */
  getTimeRemaining(): number {
    if (!this.token) {
      return SPECIAL_VALUES.NO_EXPIRY;
    }
    try {
      const expirationMs = getTokenExpiration(this.token);
      const remaining = expirationMs - Date.now();
      return Math.max(SPECIAL_VALUES.MIN_TIME, remaining);
    } catch {
      // If token is invalid, return 0 (expired)
      return SPECIAL_VALUES.MIN_TIME;
    }
  }

  /**
   * Clears the stored challenge token
   */
  clearChallengeToken(): void {
    this.token = null;
  }
}
