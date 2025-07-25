import type { HumanmarkConfig } from '@/types/config';
import { ApiClient } from './ApiClient';
import { ChallengeManager } from './ChallengeManager';
import { DEFAULT_BASE_URL } from '@/constants/endpoints';
import type { UIManager } from '@/ui/UIManager';
import {
  HumanmarkConfigError,
  HumanmarkApiError,
} from '@/errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';
import { HTTP_HEADERS } from '@/constants/http';
import {
  createConfigError,
  createNoChallengeError,
  createNoReceiptError,
  createCancelledError,
} from '@/errors/factories';
import { ThemeManager } from '@/ui/ThemeManager';

/**
 * Main SDK class for Humanmark verification
 *
 * @example
 * // Initialize with pre-created challenge token from your backend
 * const sdk = new HumanmarkSdk({
 *   apiKey: 'your-api-key',
 *   challengeToken: 'challenge-token-from-backend'
 * });
 *
 * @example
 * // Using custom base URL for staging environment
 * const sdk = new HumanmarkSdk({
 *   apiKey: 'your-api-key',
 *   challengeToken: 'challenge-token-from-backend',
 *   baseUrl: 'https://staging.humanmark.io'
 * });
 */
export class HumanmarkSdk {
  private config: HumanmarkConfig;
  private apiClient: ApiClient;
  private challengeManager: ChallengeManager;
  private uiManager: UIManager | null = null;
  private verificationInProgress: Promise<string> | null = null;

  /**
   * Creates a new instance of HumanmarkSdk
   *
   * @param config - Configuration object for the SDK
   * @param config.apiKey - Your Humanmark API key (required)
   * @param config.challengeToken - Pre-created challenge token from your backend (required)
   * @param config.baseUrl - Base URL for API requests (optional, defaults to 'https://humanmark.io')
   * @param config.theme - Theme for the modal: 'light', 'dark', or 'auto' (optional, defaults to 'dark')
   *
   * @throws {Error} If configuration is invalid
   */
  constructor(config: HumanmarkConfig) {
    this.validateConfig(config);
    this.config = { ...config };
    this.apiClient = new ApiClient(config.baseUrl ?? DEFAULT_BASE_URL);
    this.challengeManager = new ChallengeManager();
    // Initialize theme
    ThemeManager.initialize(config.theme);
    // UI Manager will be loaded on demand
  }

  private validateConfig(config: HumanmarkConfig): void {
    // Basic type validation
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw new HumanmarkConfigError(
        'API key is required and must be a string',
        ErrorCode.INVALID_API_KEY
      );
    }

    if (!config.challengeToken || typeof config.challengeToken !== 'string') {
      throw createConfigError(
        'Challenge token is required and must be a string',
        'challengeToken'
      );
    }
  }

  /**
   * Starts the verification process
   *
   * Shows a modal with either a QR code (desktop) or deep link button (mobile)
   * and waits for the user to complete verification in the Humanmark app.
   *
   * @returns Promise that resolves with the receipt
   * @throws {Error} If verification fails or times out
   *
   * @example
   * try {
   *   const receipt = await sdk.verify();
   *   // Send receipt to your backend for validation
   *   await submitToBackend(receipt);
   * } catch (error) {
   *   console.error('Verification failed:', error);
   * }
   */
  async verify(): Promise<string> {
    // Use a synchronous check-and-set pattern to prevent race conditions
    const existingPromise = this.verificationInProgress;
    if (existingPromise) {
      return existingPromise;
    }

    // Create the promise and immediately store it to prevent races
    const verificationPromise = this.performVerification();
    this.verificationInProgress = verificationPromise;

    // Clean up after completion
    verificationPromise
      .finally(() => {
        // Only clear if this is still the active promise
        if (this.verificationInProgress === verificationPromise) {
          this.verificationInProgress = null;
        }
      })
      .catch(() => {
        // Ignore errors here - they're already handled by the caller
      });

    return verificationPromise;
  }

  private async performVerification(): Promise<string> {
    let verificationCompleted = false;
    const abortController = new AbortController();

    try {
      // Step 1: Initialize and get challenge
      this.initialize();

      // Step 2: Show modal with QR code or deep link
      await this.showVerificationModal();

      // Step 3: Set up modal close detection
      this.uiManager?.onModalClosed(() => {
        // Only reject if verification hasn't completed successfully
        if (!verificationCompleted) {
          // Cancel the verification process
          abortController.abort();
          this.apiClient.cancelPendingRequests();
        }
      });

      // Step 4: Wait for verification with abort support
      const result = await this.waitForVerification(abortController.signal);

      // Mark verification as completed
      verificationCompleted = true;

      // Step 5: Show success animation and wait for it to complete
      if (this.uiManager) {
        // Create a promise that resolves when success animation completes
        const successAnimationComplete = new Promise<void>(resolve => {
          // Set up callback to resolve when animation finishes
          this.uiManager?.onSuccess(() => {
            this.cleanup();
            resolve();
          });
        });

        // Show the success animation
        this.uiManager.showSuccess();

        // Wait for the success animation to complete before returning the receipt
        await successAnimationComplete;
      } else {
        // Fallback if no UI manager
        this.cleanup();
      }

      return result;
    } catch (error) {
      verificationCompleted = true;
      this.cleanup();

      // Always re-throw the error
      throw error;
    }
  }

  private initialize(): void {
    // Set the challenge token from config
    this.challengeManager.setChallengeToken(this.config.challengeToken);
  }

  private async showVerificationModal(): Promise<void> {
    const token = this.challengeManager.getCurrentToken();
    if (!token) {
      throw createNoChallengeError();
    }

    // Dynamically load UI Manager when needed
    if (!this.uiManager) {
      const { loadUIManager } = await import('@/ui');
      const UIManagerClass = await loadUIManager();
      this.uiManager = new UIManagerClass();
    }

    // Pass token to modal - it contains all necessary info (challenge, shard, expiry)
    await this.uiManager.showVerificationModal(token);
  }

  private async waitForVerification(signal: AbortSignal): Promise<string> {
    const token = this.challengeManager.getCurrentToken();
    if (!token) {
      throw createNoChallengeError();
    }

    // Check if token has already expired before making the API call
    if (this.challengeManager.isExpired()) {
      throw new HumanmarkApiError(
        'Challenge expired',
        ErrorCode.CHALLENGE_EXPIRED,
        410
      );
    }

    // Check if already aborted
    if (signal.aborted) {
      throw createCancelledError();
    }

    let abortHandler: (() => void) | null = null;

    try {
      // Create a promise that resolves when aborted
      const waitForAbort = new Promise<void>(resolve => {
        abortHandler = (): void => resolve();
        signal.addEventListener('abort', abortHandler, { once: true });
      });

      // Start the API call
      const apiCallPromise = this.apiClient.waitForChallengeToken(token, {
        [HTTP_HEADERS.API_KEY]: this.config.apiKey,
      });

      // Wait for either the API call to complete or abort signal
      const raceResult = await Promise.race([
        apiCallPromise.then(result => ({ type: 'success' as const, result })),
        waitForAbort.then(() => ({ type: 'aborted' as const })),
      ]);

      if (raceResult.type === 'aborted') {
        // Cancel the ongoing API request
        this.apiClient.cancelPendingRequests();
        throw createCancelledError();
      }

      const result = raceResult.result;
      if (result.receipt) {
        return result.receipt;
      } else {
        throw createNoReceiptError();
      }
    } finally {
      // Clean up the abort handler
      if (abortHandler) {
        signal.removeEventListener('abort', abortHandler);
      }
    }
  }

  /**
   * Cleans up resources after verification
   * Called automatically after verification completes or fails
   * @param immediate - Skip animations for immediate cleanup (useful for tests)
   */
  cleanup(immediate = false): void {
    // Cancel any ongoing API requests
    this.apiClient.cancelPendingRequests();
    this.challengeManager.clearChallengeToken();
    this.uiManager?.hideModal(immediate);
  }
}
