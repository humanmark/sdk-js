/**
 * Utility functions for working with challenge tokens (Protobuf format)
 */

import { decodeChallengeToken } from '@/generated/challenge_token';
import {
  HumanmarkChallengeError,
  HumanmarkNetworkError,
} from '@/errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';

/**
 * Claims contained in the challenge token
 */
export interface ChallengeTokenClaims {
  shard: string; // Replaces region
  challenge: string;
  exp: number; // Expiration timestamp (seconds since epoch)
  iat?: number; // Issued at timestamp
  domain?: string; // Domain from the token
}

/**
 * Parsed challenge token data
 */
export interface ParsedChallengeToken {
  token: string;
  claims: ChallengeTokenClaims;
}

/**
 * Decodes base64url string to Uint8Array
 * @param base64url - Base64url encoded string (no padding)
 * @returns Decoded bytes
 */
function base64urlDecode(base64url: string): Uint8Array {
  // Add padding if needed
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padding);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Parses a Protobuf challenge token without verification (client-side decode only)
 * Note: This does NOT verify the signature - it only extracts the claims
 *
 * @param token - Challenge token string (format: {base64url_protobuf}.{signature})
 * @returns Parsed token with claims
 * @throws {HumanmarkChallengeError} If the token is invalid
 */
export function parseChallengeToken(token: string): ParsedChallengeToken {
  try {
    // Token structure: protobuf_payload.signature
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid token format');
    }

    // Decode the payload (base64url)
    const payload = parts[0];
    if (!payload) {
      throw new Error('Invalid token format: missing payload');
    }
    const bytes = base64urlDecode(payload);

    // Try to parse as Protobuf first
    try {
      const challengeToken = decodeChallengeToken(bytes);

      // Extract fields
      const challenge = challengeToken.challenge;
      const shard = challengeToken.shard;
      const domain = challengeToken.domain;
      const expiresAt = challengeToken.expires_at;
      const issuedAt = challengeToken.issued_at;

      // Validate required fields
      if (!shard || !challenge || !expiresAt) {
        throw new Error('Missing required token claims');
      }

      // Protobuf timestamps are already in seconds
      const exp = expiresAt;
      const iat = issuedAt ?? undefined;

      const claims: ChallengeTokenClaims = {
        shard,
        challenge,
        exp,
        ...(iat && { iat }),
        ...(domain && { domain }),
      };

      return {
        token,
        claims,
      };
    } catch (protobufError) {
      // If Protobuf parsing fails, try JSON parsing (for test mocks)
      // This is only for testing - production tokens should always be Protobufs
      try {
        const decoded = new TextDecoder().decode(bytes);
        const mockData = JSON.parse(decoded) as {
          shard?: string;
          challenge?: string;
          exp?: number;
          expires_at?: number;
          expiresAt?: number;
          iat?: number;
          issued_at?: number;
          issuedAt?: number;
          domain?: string;
        };

        // Handle test mock format
        if (
          mockData.shard &&
          mockData.challenge &&
          (mockData.exp ?? mockData.expiresAt ?? mockData.expires_at)
        ) {
          const claims: ChallengeTokenClaims = {
            shard: mockData.shard,
            challenge: mockData.challenge,
            exp:
              mockData.exp ??
              mockData.expires_at ??
              (mockData.expiresAt ? mockData.expiresAt / 1000 : 0),
            ...(mockData.iat && { iat: mockData.iat }),
            ...(mockData.issued_at &&
              !mockData.iat && { iat: mockData.issued_at }),
            ...(mockData.issuedAt &&
              !mockData.iat &&
              !mockData.issued_at && { iat: mockData.issuedAt / 1000 }),
            ...(mockData.domain && { domain: mockData.domain }),
          };

          return {
            token,
            claims,
          };
        }
      } catch {
        // If JSON parsing also fails, rethrow the original Protobuf error
        throw protobufError;
      }

      throw new Error('Invalid token format');
    }
  } catch (error) {
    throw new HumanmarkChallengeError(
      `Invalid challenge token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCode.INVALID_CHALLENGE_FORMAT
    );
  }
}

/**
 * Extracts the shard (region) from a challenge token
 *
 * @param token - Challenge token
 * @returns The shard (region) from the token claims
 * @throws {HumanmarkChallengeError} If the token is invalid
 */
export function parseShardFromToken(token: string): string {
  const parsed = parseChallengeToken(token);
  return parsed.claims.shard;
}

/**
 * Extracts the challenge ID from a challenge token
 *
 * @param token - Challenge token
 * @returns The challenge ID from the token claims
 * @throws {HumanmarkChallengeError} If the token is invalid
 */
export function parseChallengeFromToken(token: string): string {
  const parsed = parseChallengeToken(token);
  return parsed.claims.challenge;
}

/**
 * Gets the expiration time from a challenge token
 *
 * @param token - Challenge token
 * @returns Expiration timestamp in milliseconds
 * @throws {HumanmarkChallengeError} If the token is invalid
 */
export function getTokenExpiration(token: string): number {
  const parsed = parseChallengeToken(token);
  // Token exp is in seconds, convert to milliseconds
  return parsed.claims.exp * 1000;
}

/**
 * Checks if a challenge token is expired
 *
 * @param token - Challenge token
 * @returns true if the token is expired
 * @throws {HumanmarkChallengeError} If the token is invalid
 */
export function isTokenExpired(token: string): boolean {
  const expirationMs = getTokenExpiration(token);
  return Date.now() >= expirationMs;
}

/**
 * Constructs a shard-specific API URL
 *
 * @param baseUrl - Base URL (e.g., https://humanmark.io)
 * @param shard - Shard identifier (e.g., us-east-1)
 * @returns Shard URL (e.g., https://us-east-1.humanmark.io)
 */
export function constructShardUrl(baseUrl: string, shard: string): string {
  try {
    const url = new URL(baseUrl);

    // Prepend shard as subdomain
    // humanmark.io -> us-east-1.humanmark.io
    url.hostname = `${shard}.${url.hostname}`;

    const result = url.toString();
    // Remove trailing slash only if there's no query or path after it
    if (result.endsWith('/') && !url.search && url.pathname === '/') {
      return result.slice(0, -1);
    }
    return result;
  } catch (error) {
    throw new HumanmarkNetworkError(
      `Failed to construct shard URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCode.NETWORK_ERROR
    );
  }
}
