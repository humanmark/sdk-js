import { describe, it, expect } from 'vitest';
import {
  parseChallengeToken,
  parseShardFromToken,
  parseChallengeFromToken,
  getTokenExpiration,
  isTokenExpired,
  constructShardUrl,
} from '../../utils/challengeToken';
import { HumanmarkError } from '../../errors/HumanmarkError';

describe('Challenge Token Utils - Error Scenarios', () => {
  describe('parseChallengeToken error cases', () => {
    it('should throw error for invalid token format (no dot)', () => {
      const invalidToken = 'invalidtokenwithoutdot';

      expect(() => parseChallengeToken(invalidToken)).toThrow(HumanmarkError);
      expect(() => parseChallengeToken(invalidToken)).toThrow(
        'Invalid challenge token'
      );
    });

    it('should throw error for token with empty payload', () => {
      const invalidToken = '.signature';

      expect(() => parseChallengeToken(invalidToken)).toThrow(HumanmarkError);
      expect(() => parseChallengeToken(invalidToken)).toThrow(
        'Invalid challenge token'
      );
    });

    it('should throw error for invalid base64 in payload', () => {
      const invalidBase64Token = 'invalid!@#base64.signature';

      expect(() => parseChallengeToken(invalidBase64Token)).toThrow(
        HumanmarkError
      );
      expect(() => parseChallengeToken(invalidBase64Token)).toThrow(
        'Invalid challenge token'
      );
    });
  });

  describe('parseChallengeFromToken error cases', () => {
    it('should throw error for invalid token', () => {
      const invalidToken = 'invalidtoken';

      expect(() => parseChallengeFromToken(invalidToken)).toThrow(
        HumanmarkError
      );
    });

    it('should throw error for empty token', () => {
      expect(() => parseChallengeFromToken('')).toThrow(HumanmarkError);
    });

    it('should extract challenge from valid token', () => {
      const validToken =
        btoa(
          JSON.stringify({
            shard: 'us-east-1',
            challenge: 'test-challenge-123',
            exp: Math.floor(Date.now() / 1000) + 3600,
          })
        ) + '.signature';

      const result = parseChallengeFromToken(validToken);
      expect(result).toBe('test-challenge-123');
    });
  });

  describe('parseShardFromToken error cases', () => {
    it('should throw error for invalid token', () => {
      const invalidToken = 'invalidtoken';

      expect(() => parseShardFromToken(invalidToken)).toThrow(HumanmarkError);
    });

    it('should throw error for empty token', () => {
      expect(() => parseShardFromToken('')).toThrow(HumanmarkError);
    });

    it('should extract shard from valid token', () => {
      const validToken =
        btoa(
          JSON.stringify({
            shard: 'us-west-2',
            challenge: 'test-challenge',
            exp: Math.floor(Date.now() / 1000) + 3600,
          })
        ) + '.signature';

      const result = parseShardFromToken(validToken);
      expect(result).toBe('us-west-2');
    });
  });

  describe('getTokenExpiration error cases', () => {
    it('should throw error for invalid token', () => {
      const invalidToken = 'invalidtoken';

      expect(() => getTokenExpiration(invalidToken)).toThrow(HumanmarkError);
    });

    it('should return expiration time from valid token', () => {
      const expTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken =
        btoa(
          JSON.stringify({
            shard: 'us-east-1',
            challenge: 'test',
            exp: expTime,
          })
        ) + '.signature';

      const result = getTokenExpiration(validToken);
      expect(result).toBe(expTime * 1000); // Convert to milliseconds
    });
  });

  describe('isTokenExpired error cases', () => {
    it('should throw error for invalid token', () => {
      const invalidToken = 'invalidtoken';

      expect(() => isTokenExpired(invalidToken)).toThrow(HumanmarkError);
    });

    it('should return true for expired token', () => {
      const expiredToken =
        btoa(
          JSON.stringify({
            shard: 'us-east-1',
            challenge: 'test',
            exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
          })
        ) + '.signature';

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return false for valid token', () => {
      const validToken =
        btoa(
          JSON.stringify({
            shard: 'us-east-1',
            challenge: 'test',
            exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
          })
        ) + '.signature';

      expect(isTokenExpired(validToken)).toBe(false);
    });
  });

  describe('constructShardUrl error cases', () => {
    it('should construct shard URL correctly', () => {
      const baseUrl = 'https://humanmark.io';
      const shard = 'us-east-1';

      const result = constructShardUrl(baseUrl, shard);
      expect(result).toBe('https://us-east-1.humanmark.io');
    });

    it('should handle baseUrl with trailing slash', () => {
      const baseUrl = 'https://humanmark.io/';
      const shard = 'us-west-2';

      const result = constructShardUrl(baseUrl, shard);
      expect(result).toBe('https://us-west-2.humanmark.io');
    });

    it('should preserve paths and query params', () => {
      const baseUrl = 'https://humanmark.io/api/v1?test=true';
      const shard = 'eu-west-1';

      const result = constructShardUrl(baseUrl, shard);
      expect(result).toBe('https://eu-west-1.humanmark.io/api/v1?test=true');
    });

    it('should throw error for invalid URL', () => {
      const invalidUrl = 'not-a-valid-url';
      const shard = 'us-east-1';

      expect(() => constructShardUrl(invalidUrl, shard)).toThrow(
        HumanmarkError
      );
    });
  });

  describe('parseChallengeToken edge cases', () => {
    it('should handle tokens with missing claims', () => {
      const tokenMissingClaims =
        btoa(
          JSON.stringify({
            shard: 'us-east-1',
            // Missing challenge and exp
          })
        ) + '.signature';

      expect(() => parseChallengeToken(tokenMissingClaims)).toThrow(
        HumanmarkError
      );
    });

    it('should handle very long tokens', () => {
      const longChallenge = 'a'.repeat(1000);
      const longToken =
        btoa(
          JSON.stringify({
            shard: 'us-east-1',
            challenge: longChallenge,
            exp: Math.floor(Date.now() / 1000) + 3600,
          })
        ) + '.signature';

      const result = parseChallengeToken(longToken);
      expect(result.claims.challenge).toBe(longChallenge);
    });

    it('should handle tokens with extra claims', () => {
      const tokenWithExtras =
        btoa(
          JSON.stringify({
            shard: 'us-east-1',
            challenge: 'test',
            exp: Math.floor(Date.now() / 1000) + 3600,
            domain: 'example.com',
            iat: Math.floor(Date.now() / 1000),
            extra: 'ignored',
          })
        ) + '.signature';

      const result = parseChallengeToken(tokenWithExtras);
      expect(result.claims.domain).toBe('example.com');
      expect(result.claims.iat).toBeDefined();
    });
  });
});
