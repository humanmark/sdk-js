import { parseChallengeToken } from '@/utils/challengeToken';
import { HumanmarkChallengeError } from '@/errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';
import { URLS, BROWSER_TARGETS, CSS_CLASSES, MESSAGES } from '@/constants/ui';
import { createElement } from '@/utils/dom';

export class DeepLinkHandler {
  private static readonly VERIFY_BASE_URL = URLS.VERIFY_BASE;

  static generateVerifyLink(token: string): string {
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

    return url.toString();
  }

  static createVerifyButton(token: string): HTMLButtonElement {
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
      this.handleVerifyClick(token);
    });

    return button;
  }

  private static handleVerifyClick(token: string): void {
    const verifyLink = this.generateVerifyLink(token);

    // Open the universal link - will open app if installed, otherwise fallback website
    window.open(verifyLink, BROWSER_TARGETS.BLANK);
  }
}
