import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseChallengeToken,
  parseShardFromToken,
  parseChallengeFromToken,
  getTokenExpiration,
  isTokenExpired,
  constructShardUrl,
} from '../../utils/challengeToken';
import { createMockToken } from '../utils/test-helpers';
import { HumanmarkChallengeError } from '../../errors/HumanmarkError';

describe('Challenge Token Utilities', () => {
  describe('parseChallengeToken', () => {
    it('should parse valid challenge tokens', () => {
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'abc123',
        exp: Math.floor((Date.now() + 300000) / 1000),
      });

      const parsed = parseChallengeToken(token);
      expect(parsed.claims.shard).toBe('us-east-1');
      expect(parsed.claims.challenge).toBe('abc123');
      expect(parsed.token).toBe(token);
    });

    it('should throw for invalid token format', () => {
      expect(() => parseChallengeToken('invalid')).toThrow(
        HumanmarkChallengeError
      );
      expect(() => parseChallengeToken('not.a.token.three.parts')).toThrow(
        HumanmarkChallengeError
      );
      expect(() => parseChallengeToken('')).toThrow(HumanmarkChallengeError);
    });

    it('should parse tokens with all standard claims', () => {
      const now = Math.floor(Date.now() / 1000);
      const token = createMockToken({
        shard: 'eu-west-1',
        challenge: 'test456',
        exp: now + 300,
        iat: now,
        domain: 'example.com',
      });

      const parsed = parseChallengeToken(token);
      expect(parsed.claims.iat).toBe(now);
      expect(parsed.claims.domain).toBe('example.com');
    });
  });

  describe('parseShardFromToken', () => {
    it('should extract shard from valid tokens', () => {
      const token1 = createMockToken({ shard: 'us-east-1', challenge: 'test' });
      const token2 = createMockToken({ shard: 'eu-west-2', challenge: 'test' });
      const token3 = createMockToken({
        shard: 'ap-southeast-1',
        challenge: 'test',
      });

      expect(parseShardFromToken(token1)).toBe('us-east-1');
      expect(parseShardFromToken(token2)).toBe('eu-west-2');
      expect(parseShardFromToken(token3)).toBe('ap-southeast-1');
    });

    it('should throw for invalid tokens', () => {
      expect(() => parseShardFromToken('invalid')).toThrow(
        HumanmarkChallengeError
      );
    });
  });

  describe('parseChallengeFromToken', () => {
    it('should extract challenge from valid tokens', () => {
      const token1 = createMockToken({
        shard: 'us-east-1',
        challenge: 'abc123',
      });
      const token2 = createMockToken({
        shard: 'us-east-1',
        challenge: 'xyz789',
      });

      expect(parseChallengeFromToken(token1)).toBe('abc123');
      expect(parseChallengeFromToken(token2)).toBe('xyz789');
    });

    it('should throw for invalid tokens', () => {
      expect(() => parseChallengeFromToken('invalid')).toThrow(
        HumanmarkChallengeError
      );
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration time in milliseconds', () => {
      const expSeconds = Math.floor((Date.now() + 300000) / 1000);
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test',
        exp: expSeconds,
      });

      const expMs = getTokenExpiration(token);
      expect(expMs).toBe(expSeconds * 1000);
    });

    it('should throw for invalid tokens', () => {
      expect(() => getTokenExpiration('invalid')).toThrow(
        HumanmarkChallengeError
      );
    });
  });

  describe('isTokenExpired', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return false for non-expired tokens', () => {
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test',
        exp: Math.floor((Date.now() + 300000) / 1000), // 5 minutes from now
      });

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired tokens', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test',
        exp: Math.floor((now + 1000) / 1000), // 1 second from now
      });

      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000);

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should throw for invalid tokens', () => {
      expect(() => isTokenExpired('invalid')).toThrow(HumanmarkChallengeError);
    });
  });

  describe('constructShardUrl', () => {
    it('should construct shard-based URLs correctly', () => {
      expect(constructShardUrl('https://humanmark.io', 'us-east-1')).toBe(
        'https://us-east-1.humanmark.io'
      );

      expect(constructShardUrl('https://humanmark.io/v1', 'eu-west-2')).toBe(
        'https://eu-west-2.humanmark.io/v1'
      );

      expect(constructShardUrl('http://example.com:8080', 'shard-1')).toBe(
        'http://shard-1.example.com:8080'
      );
    });

    it('should handle various domain formats', () => {
      expect(constructShardUrl('https://backend.service.com', 'shard')).toBe(
        'https://shard.backend.service.com'
      );

      expect(constructShardUrl('https://sub.domain.com', 'shard')).toBe(
        'https://shard.sub.domain.com'
      );
    });

    it('should preserve paths and query parameters', () => {
      expect(constructShardUrl('https://humanmark.io/v2/test', 'shard')).toBe(
        'https://shard.humanmark.io/v2/test'
      );

      expect(
        constructShardUrl('https://humanmark.io?param=value', 'shard')
      ).toBe('https://shard.humanmark.io/?param=value');
    });

    it('should throw for invalid URLs', () => {
      expect(() => constructShardUrl('not-a-url', 'shard')).toThrow(
        'Failed to construct shard URL'
      );

      expect(() => constructShardUrl('', 'shard')).toThrow(
        'Failed to construct shard URL'
      );
    });
  });
});
