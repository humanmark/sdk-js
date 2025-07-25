import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeepLinkHandler } from '../../ui/DeepLinkHandler';
import { HumanmarkChallengeError } from '../../errors/HumanmarkError';
import {
  URLS,
  BROWSER_TARGETS,
  CSS_CLASSES,
  MESSAGES,
} from '../../constants/ui';
import { createMockToken } from '../utils/test-helpers';

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('DeepLinkHandler', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear();
  });

  describe('generateVerifyLink', () => {
    it('should generate valid verify link with challenge token', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'validChallenge123',
      });

      // Act
      const link = DeepLinkHandler.generateVerifyLink(token);

      // Assert
      const url = new URL(link);
      expect(url.origin + url.pathname).toBe(URLS.VERIFY_BASE);
      expect(url.searchParams.get('token')).toBe(token);
      expect(url.searchParams.get('callback')).toBeNull();
    });

    it('should include callback parameter when provided', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'validChallenge123',
      });
      const callback = 'https://example.com/verify/complete';

      // Act
      const link = DeepLinkHandler.generateVerifyLink(token, callback);

      // Assert
      const url = new URL(link);
      expect(url.origin + url.pathname).toBe(URLS.VERIFY_BASE);
      expect(url.searchParams.get('token')).toBe(token);
      expect(url.searchParams.get('callback')).toBe(callback);
    });

    it('should handle callback URLs with special characters', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'validChallenge123',
      });
      const callback =
        'https://example.com/callback?session=abc&user=test@example.com';

      // Act
      const link = DeepLinkHandler.generateVerifyLink(token, callback);

      // Assert
      const url = new URL(link);
      expect(url.searchParams.get('callback')).toBe(callback);
    });

    it('should handle custom protocol callbacks', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'validChallenge123',
      });
      const callback = 'myapp://verification/complete';

      // Act
      const link = DeepLinkHandler.generateVerifyLink(token, callback);

      // Assert
      const url = new URL(link);
      expect(url.searchParams.get('callback')).toBe(callback);
    });

    it('should handle special characters in token', () => {
      // Arrange
      const token = createMockToken({
        shard: 'eu-west-1',
        challenge: 'challenge/with+special=chars',
      });

      // Act
      const link = DeepLinkHandler.generateVerifyLink(token);

      // Assert
      const url = new URL(link);
      expect(url.searchParams.get('token')).toBe(token);
    });

    it('should throw error for invalid token format', () => {
      // Arrange
      const invalidToken = 'not-a-token';

      // Act & Assert
      expect(() => DeepLinkHandler.generateVerifyLink(invalidToken)).toThrow(
        HumanmarkChallengeError
      );
    });

    it('should throw error for empty token', () => {
      // Act & Assert
      expect(() => DeepLinkHandler.generateVerifyLink('')).toThrow(
        HumanmarkChallengeError
      );
    });

    it('should throw error for malformed token', () => {
      // Arrange
      const malformedToken = 'header.payload'; // Missing signature part

      // Act & Assert
      expect(() => DeepLinkHandler.generateVerifyLink(malformedToken)).toThrow(
        HumanmarkChallengeError
      );
    });
  });

  describe('createVerifyButton', () => {
    it('should create button with correct attributes', () => {
      // Arrange
      const token = createMockToken();

      // Act
      const button = DeepLinkHandler.createVerifyButton(token);

      // Assert
      expect(button.tagName).toBe('BUTTON');
      expect(button.className).toBe(CSS_CLASSES.BUTTONS.VERIFY);
      expect(button.textContent).toBe(MESSAGES.VERIFICATION.BUTTON_TEXT);
    });

    it('should open verify link when clicked', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-west-2',
        challenge: 'testChallenge789',
      });
      const button = DeepLinkHandler.createVerifyButton(token);

      // Act
      button.click();

      // Assert
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
      const expectedLink = DeepLinkHandler.generateVerifyLink(token);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expectedLink,
        BROWSER_TARGETS.BLANK
      );
    });

    it('should include callback in verify link when provided', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-west-2',
        challenge: 'testChallenge789',
      });
      const callback = 'https://example.com/callback';
      const button = DeepLinkHandler.createVerifyButton(token, callback);

      // Act
      button.click();

      // Assert
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
      const expectedLink = DeepLinkHandler.generateVerifyLink(token, callback);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expectedLink,
        BROWSER_TARGETS.BLANK
      );

      // Verify the URL includes the callback
      const calledUrl = mockWindowOpen.mock.calls[0]?.[0] as string | undefined;
      expect(calledUrl).toBeDefined();
      if (!calledUrl) throw new Error('Expected calledUrl to be defined');
      const url = new URL(calledUrl);
      expect(url.searchParams.get('callback')).toBe(callback);
    });

    it('should handle click event properly', () => {
      // Arrange
      const token = createMockToken({
        shard: 'ap-southeast-1',
        challenge: 'validChallenge456',
      });
      const button = DeepLinkHandler.createVerifyButton(token);

      // Create a click event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      // Act
      button.dispatchEvent(clickEvent);

      // Assert
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
      const callArgs = mockWindowOpen.mock.calls[0] ?? [];
      const url = callArgs[0] as string | undefined;
      const target = callArgs[1] as string | undefined;
      expect(url).toContain('token=');
      expect(url).toContain(encodeURIComponent(token));
      expect(target).toBe(BROWSER_TARGETS.BLANK);
    });

    it('should create multiple independent buttons', () => {
      // Arrange
      const token1 = createMockToken({
        shard: 'us-east-1',
        challenge: 'challenge1',
      });
      const token2 = createMockToken({
        shard: 'eu-west-1',
        challenge: 'challenge2',
      });
      const button1 = DeepLinkHandler.createVerifyButton(token1);
      const button2 = DeepLinkHandler.createVerifyButton(token2);

      // Act
      button1.click();
      button2.click();

      // Assert
      expect(mockWindowOpen).toHaveBeenCalledTimes(2);
      expect(mockWindowOpen.mock.calls[0]?.[0]).toContain(
        `token=${encodeURIComponent(token1)}`
      );
      expect(mockWindowOpen.mock.calls[1]?.[0]).toContain(
        `token=${encodeURIComponent(token2)}`
      );
    });
  });

  describe('handleVerifyClick (via button)', () => {
    it('should handle errors from invalid token gracefully', () => {
      // Arrange
      const invalidToken = 'not.a.token';

      // Act & Assert - button creation should now throw immediately
      expect(() => {
        DeepLinkHandler.createVerifyButton(invalidToken);
      }).toThrow(HumanmarkChallengeError);

      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });
});
