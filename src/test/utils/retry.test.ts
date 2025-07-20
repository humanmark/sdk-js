import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateRetryDelay, delay, shouldRetry } from '../../utils/retry';
import { RETRY_CONFIG } from '../../constants/retry';

describe('retry utilities', () => {
  describe('calculateRetryDelay', () => {
    beforeEach(() => {
      // Mock Math.random to return predictable values
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should calculate delay for first attempt', () => {
      // Act
      const delay = calculateRetryDelay(0);

      // Assert
      expect(delay).toBe(RETRY_CONFIG.INITIAL_DELAY_MS);
    });

    it('should calculate exponential backoff for subsequent attempts', () => {
      // Act
      const delay1 = calculateRetryDelay(1);
      const delay2 = calculateRetryDelay(2);
      const delay3 = calculateRetryDelay(3);

      // Assert
      expect(delay1).toBe(
        RETRY_CONFIG.INITIAL_DELAY_MS * RETRY_CONFIG.BACKOFF_FACTOR
      );
      expect(delay2).toBe(
        RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, 2)
      );
      expect(delay3).toBe(
        RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, 3)
      );
    });

    it('should add jitter to prevent thundering herd', () => {
      // Arrange
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0) // Will give negative jitter
        .mockReturnValueOnce(1); // Will give positive jitter

      // Act
      const delayWithNegativeJitter = calculateRetryDelay(1);
      const delayWithPositiveJitter = calculateRetryDelay(1);

      // Assert
      const baseDelay =
        RETRY_CONFIG.INITIAL_DELAY_MS * RETRY_CONFIG.BACKOFF_FACTOR;
      const maxJitter = baseDelay * RETRY_CONFIG.JITTER_FACTOR;

      expect(delayWithNegativeJitter).toBeLessThan(baseDelay);
      expect(delayWithPositiveJitter).toBeGreaterThan(baseDelay);
      expect(delayWithNegativeJitter).toBeGreaterThanOrEqual(
        baseDelay - maxJitter
      );
      expect(delayWithPositiveJitter).toBeLessThanOrEqual(
        baseDelay + maxJitter
      );
    });

    it('should never return negative delay', () => {
      // Arrange - Mock extreme negative jitter
      vi.spyOn(Math, 'random').mockReturnValue(0);

      // Act - calculateRetryDelay should handle edge cases properly
      const delay = calculateRetryDelay(0);

      // Assert
      expect(delay).toBeGreaterThanOrEqual(0);
    });
  });

  describe('delay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should resolve after specified milliseconds', async () => {
      // Arrange
      const ms = 1000;

      // Act
      const promise = delay(ms);
      vi.advanceTimersByTime(ms);

      // Assert
      await expect(promise).resolves.toBeUndefined();
    });

    it('should reject immediately if signal is already aborted', async () => {
      // Arrange
      const abortController = new AbortController();
      abortController.abort();

      // Act & Assert
      await expect(delay(1000, abortController.signal)).rejects.toThrow(
        'Aborted'
      );
    });

    it('should reject if signal is aborted during delay', async () => {
      // Arrange
      const abortController = new AbortController();
      const ms = 1000;

      // Act
      const promise = delay(ms, abortController.signal);
      vi.advanceTimersByTime(500);
      abortController.abort();

      // Assert
      await expect(promise).rejects.toThrow('Aborted');
    });

    it('should clean up timeout when aborted', async () => {
      // Arrange
      const abortController = new AbortController();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      // Act
      const promise = delay(1000, abortController.signal);
      abortController.abort();

      // Assert
      await expect(promise).rejects.toThrow();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should work without abort signal', async () => {
      // Act
      const promise = delay(100);
      vi.advanceTimersByTime(100);

      // Assert
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('shouldRetry', () => {
    it('should return false when max attempts reached', () => {
      // Arrange
      const attempt = RETRY_CONFIG.MAX_RETRIES;
      const startTime = Date.now();
      const maxTime = 60000;

      // Act
      const result = shouldRetry(attempt, startTime, maxTime);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when max time exceeded', () => {
      // Arrange
      const attempt = 0;
      const startTime = Date.now() - 70000; // Started 70 seconds ago
      const maxTime = 60000; // 60 second limit

      // Act
      const result = shouldRetry(attempt, startTime, maxTime);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when within limits', () => {
      // Arrange
      const attempt = 2;
      const startTime = Date.now() - 5000; // Started 5 seconds ago
      const maxTime = 60000; // 60 second limit

      // Act
      const result = shouldRetry(attempt, startTime, maxTime);

      // Assert
      expect(result).toBe(true);
    });

    it('should use custom max attempts when provided', () => {
      // Arrange
      const attempt = 3;
      const startTime = Date.now();
      const maxTime = 60000;
      const maxAttempts = 3;

      // Act
      const result = shouldRetry(attempt, startTime, maxTime, maxAttempts);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle edge case at exact time limit', () => {
      // Arrange
      const attempt = 0;
      const maxTime = 60000;
      const startTime = Date.now() - maxTime; // Exactly at limit

      // Act
      const result = shouldRetry(attempt, startTime, maxTime);

      // Assert
      expect(result).toBe(false);
    });
  });
});
