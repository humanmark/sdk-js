import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChallengeManager } from '../../core/ChallengeManager';
import { SPECIAL_VALUES } from '../../constants/retry';
import { HumanmarkChallengeError } from '../../errors/HumanmarkError';
import { createMockToken } from '../utils/test-helpers';

describe('ChallengeManager', () => {
  let challengeManager: ChallengeManager;

  beforeEach(() => {
    challengeManager = new ChallengeManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setChallengeToken', () => {
    it('should store valid challenge token', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'validChallenge123',
      });

      // Act
      challengeManager.setChallengeToken(token);

      // Assert
      expect(challengeManager.getCurrentToken()).toBe(token);
    });

    it('should store challenge token with custom expiration', () => {
      // Arrange
      const exp = Math.floor((Date.now() + 300000) / 1000); // 5 minutes from now
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'validChallenge456',
        exp,
      });

      // Act
      challengeManager.setChallengeToken(token);

      // Assert
      expect(challengeManager.getCurrentToken()).toBe(token);
    });

    it('should throw error for invalid token format', () => {
      // Arrange
      const invalidToken = 'invalid-token-format';

      // Act & Assert
      expect(() => challengeManager.setChallengeToken(invalidToken)).toThrow(
        HumanmarkChallengeError
      );
    });

    it('should throw error for empty token', () => {
      // Act & Assert
      expect(() => challengeManager.setChallengeToken('')).toThrow(
        HumanmarkChallengeError
      );
    });

    it('should replace existing token', () => {
      // Arrange
      const firstToken = createMockToken({
        shard: 'us-east-1',
        challenge: 'first123',
      });
      const secondToken = createMockToken({
        shard: 'eu-west-1',
        challenge: 'second456',
      });

      // Act
      challengeManager.setChallengeToken(firstToken);
      challengeManager.setChallengeToken(secondToken);

      // Assert
      expect(challengeManager.getCurrentToken()).toBe(secondToken);
    });
  });

  describe('getCurrentToken', () => {
    it('should return null when no token is set', () => {
      // Act & Assert
      expect(challengeManager.getCurrentToken()).toBeNull();
    });

    it('should return token when not expired', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'active123',
        exp: Math.floor((Date.now() + 60000) / 1000), // 1 minute from now
      });
      challengeManager.setChallengeToken(token);

      // Act & Assert
      expect(challengeManager.getCurrentToken()).toBe(token);
    });

    it('should return null when token is expired', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-west-2',
        challenge: 'expired123',
        exp: Math.floor((Date.now() + 1000) / 1000), // 1 second from now
      });
      challengeManager.setChallengeToken(token);

      // Act - advance time past expiration
      vi.advanceTimersByTime(2000);

      // Assert
      expect(challengeManager.getCurrentToken()).toBeNull();
    });

    it('should return token when expiration is far in the future', () => {
      // Arrange
      const token = createMockToken({
        shard: 'ap-southeast-1',
        challenge: 'longExpiry123',
        exp: Math.floor((Date.now() + 86400000) / 1000), // 24 hours from now
      });
      challengeManager.setChallengeToken(token);

      // Act - advance time significantly
      vi.advanceTimersByTime(3600000); // 1 hour

      // Assert - should still be valid
      expect(challengeManager.getCurrentToken()).toBe(token);
    });
  });

  describe('isExpired', () => {
    it('should return true when no token is set', () => {
      // Act & Assert
      expect(challengeManager.isExpired()).toBe(true);
    });

    it('should return false when token is not expired', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test123',
        exp: Math.floor((Date.now() + 60000) / 1000), // 1 minute from now
      });
      challengeManager.setChallengeToken(token);

      // Act & Assert
      expect(challengeManager.isExpired()).toBe(false);
    });

    it('should return true when token is expired', () => {
      // Arrange
      const token = createMockToken({
        shard: 'eu-west-1',
        challenge: 'test123',
        exp: Math.floor((Date.now() + 1000) / 1000), // 1 second from now
      });
      challengeManager.setChallengeToken(token);

      // Act
      vi.advanceTimersByTime(2000);

      // Assert
      expect(challengeManager.isExpired()).toBe(true);
    });

    it('should return true for malformed token', () => {
      // Arrange - Force an invalid token to be stored
      // @ts-expect-error - Bypassing validation for testing
      challengeManager.token = 'malformed.token';

      // Act & Assert
      expect(challengeManager.isExpired()).toBe(true);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return NO_EXPIRY when no token is set', () => {
      // Act & Assert
      expect(challengeManager.getTimeRemaining()).toBe(
        SPECIAL_VALUES.NO_EXPIRY
      );
    });

    it('should return remaining time when token is not expired', () => {
      // Arrange
      const now = Date.now();
      const exp = Math.floor((now + 60000) / 1000); // 1 minute from now
      vi.setSystemTime(now);
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test123',
        exp,
      });
      challengeManager.setChallengeToken(token);

      // Act & Assert
      const remaining = challengeManager.getTimeRemaining();
      // Allow small tolerance for time calculations
      expect(remaining).toBeGreaterThanOrEqual(59000);
      expect(remaining).toBeLessThanOrEqual(60000);
    });

    it('should return 0 when token is expired', () => {
      // Arrange
      const now = Date.now();
      const exp = Math.floor((now + 1000) / 1000); // 1 second from now
      vi.setSystemTime(now);
      const token = createMockToken({
        shard: 'eu-west-1',
        challenge: 'test123',
        exp,
      });
      challengeManager.setChallengeToken(token);

      // Act
      vi.advanceTimersByTime(2000);

      // Assert
      expect(challengeManager.getTimeRemaining()).toBe(SPECIAL_VALUES.MIN_TIME);
    });

    it('should return decreasing time as time passes', () => {
      // Arrange
      const now = Date.now();
      const exp = Math.floor((now + 60000) / 1000); // 1 minute from now
      vi.setSystemTime(now);
      const token = createMockToken({
        shard: 'ap-northeast-1',
        challenge: 'test123',
        exp,
      });
      challengeManager.setChallengeToken(token);

      // Act & Assert
      const initial = challengeManager.getTimeRemaining();
      expect(initial).toBeGreaterThanOrEqual(59000);
      expect(initial).toBeLessThanOrEqual(60000);

      vi.advanceTimersByTime(30000); // 30 seconds pass
      const after30s = challengeManager.getTimeRemaining();
      expect(after30s).toBeGreaterThanOrEqual(29000);
      expect(after30s).toBeLessThanOrEqual(30000);

      vi.advanceTimersByTime(20000); // 20 more seconds pass
      const after50s = challengeManager.getTimeRemaining();
      expect(after50s).toBeGreaterThanOrEqual(9000);
      expect(after50s).toBeLessThanOrEqual(10000);
    });

    it('should return MIN_TIME for malformed token', () => {
      // Arrange - Force an invalid token to be stored
      // @ts-expect-error - Bypassing validation for testing
      challengeManager.token = 'malformed.token';

      // Act & Assert
      expect(challengeManager.getTimeRemaining()).toBe(SPECIAL_VALUES.MIN_TIME);
    });
  });

  describe('clearChallengeToken', () => {
    it('should clear stored token', () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test123',
      });
      challengeManager.setChallengeToken(token);
      expect(challengeManager.getCurrentToken()).toBeTruthy();

      // Act
      challengeManager.clearChallengeToken();

      // Assert
      expect(challengeManager.getCurrentToken()).toBeNull();
    });

    it('should reset time remaining to NO_EXPIRY', () => {
      // Arrange
      const token = createMockToken({
        shard: 'eu-central-1',
        challenge: 'test123',
        exp: Math.floor((Date.now() + 60000) / 1000),
      });
      challengeManager.setChallengeToken(token);
      expect(challengeManager.getTimeRemaining()).not.toBe(
        SPECIAL_VALUES.NO_EXPIRY
      );

      // Act
      challengeManager.clearChallengeToken();

      // Assert
      expect(challengeManager.getTimeRemaining()).toBe(
        SPECIAL_VALUES.NO_EXPIRY
      );
    });

    it('should be safe to call when no token is set', () => {
      // Act & Assert - should not throw
      expect(() => challengeManager.clearChallengeToken()).not.toThrow();
      expect(challengeManager.getCurrentToken()).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      // Arrange
      const token = createMockToken({
        shard: 'sa-east-1',
        challenge: 'test123',
      });
      challengeManager.setChallengeToken(token);

      // Act & Assert - should not throw
      expect(() => {
        challengeManager.clearChallengeToken();
        challengeManager.clearChallengeToken();
        challengeManager.clearChallengeToken();
      }).not.toThrow();

      expect(challengeManager.getCurrentToken()).toBeNull();
    });
  });
});
