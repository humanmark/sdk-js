import { parseChallengeToken } from '@/utils/challengeToken';
import { HumanmarkChallengeError } from '@/errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';
import { URLS, BROWSER_TARGETS, CSS_CLASSES, MESSAGES } from '@/constants/ui';
import { createElement } from '@/utils/dom';

export class DeepLinkHandler {
  private static readonly VERIFY_BASE_URL = URLS.VERIFY_BASE;

  /**
   * Generates a deep link URL for the Humanmark app
   *
   * @param token - The challenge token to include in the deep link
   * @param callback - Optional callback URL for app redirection after verification.
   *                   When provided, the Humanmark app will redirect to:
   *                   ${callback}?receipt=${receipt}
   *                   Supports both web URLs and custom app protocol schemes.
   * @returns The complete deep link URL with encoded parameters
   *
   * @example
   * // Basic deep link
   * const link = DeepLinkHandler.generateVerifyLink(token);
   * // Returns: https://humanmark.app/verify?token=abc123
   *
   * @example
   * // With web callback
   * const link = DeepLinkHandler.generateVerifyLink(
   *   token,
   *   'https://example.com/callback'
   * );
   * // Returns: https://humanmark.app/verify?token=abc123&callback=https%3A%2F%2Fexample.com%2Fcallback
   *
   * @example
   * // With custom protocol callback
   * const link = DeepLinkHandler.generateVerifyLink(
   *   token,
   *   'myapp://verify/complete'
   * );
   */
  static generateVerifyLink(token: string, callback?: string): string {
    // Validate token format by attempting to parse it
    try {
      parseChallengeToken(token);
    } catch {
      throw new HumanmarkChallengeError(
        'Invalid challenge token',
        ErrorCode.INVALID_CHALLENGE_FORMAT
      );
    }

    const url = new URL(this.VERIFY_BASE_URL);
    url.searchParams.set('token', token);

    // Add callback parameter if provided
    if (callback) {
      url.searchParams.set('callback', callback);
    }

    return url.toString();
  }

  /**
   * Creates a button that opens the Humanmark app when clicked
   *
   * @param token - The challenge token for verification
   * @param callback - Optional callback URL for post-verification redirection.
   *                   Only used on mobile devices when the button is clicked.
   * @returns An HTML button element configured to open the Humanmark app
   *
   * @throws {HumanmarkChallengeError} If the token format is invalid
   */
  static createVerifyButton(
    token: string,
    callback?: string
  ): HTMLButtonElement {
    // Validate token early so any errors happen during button creation, not on click
    try {
      parseChallengeToken(token);
    } catch {
      throw new HumanmarkChallengeError(
        'Invalid challenge token',
        ErrorCode.INVALID_CHALLENGE_FORMAT
      );
    }

    const button = createElement('button', {
      className: CSS_CLASSES.BUTTONS.VERIFY,
      textContent: MESSAGES.VERIFICATION.BUTTON_TEXT,
    });

    button.addEventListener('click', () => {
      this.handleVerifyClick(token, callback);
    });

    return button;
  }

  private static handleVerifyClick(token: string, callback?: string): void {
    const verifyLink = this.generateVerifyLink(token, callback);

    // Open the universal link - will open app if installed, otherwise fallback website
    window.open(verifyLink, BROWSER_TARGETS.BLANK);
  }
}
