import { HumanmarkConfigError } from '@/errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';

/**
 * Validates if a string is a valid URL format
 * Supports all protocols including custom schemes (e.g., myapp://)
 * Blocks potentially dangerous protocols (javascript:, data:, vbscript:)
 *
 * @param url - The URL string to validate
 * @returns true if valid URL format, false otherwise
 *
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('myapp://callback') // true
 * isValidUrl('not a url') // false
 * isValidUrl('javascript:alert(1)') // false - dangerous protocol
 */
export function isValidUrl(url: string): boolean {
  try {
    // URL constructor will throw if the URL is malformed
    // It supports all protocols including custom schemes
    const parsedUrl = new URL(url);

    // Reject potentially dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    if (dangerousProtocols.some(protocol => parsedUrl.protocol === protocol)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a callback URL and throws if invalid
 * Used during SDK initialization to ensure the callback URL is properly formatted
 *
 * @param url - The callback URL to validate
 * @throws {HumanmarkConfigError} If the URL is invalid
 *
 * @example
 * validateCallbackUrl('https://example.com/callback') // No error
 * validateCallbackUrl('myapp://verify') // No error
 * validateCallbackUrl('invalid url') // Throws HumanmarkConfigError
 */
export function validateCallbackUrl(url: string): void {
  if (!isValidUrl(url)) {
    throw new HumanmarkConfigError(
      `Invalid callback URL format: "${url}". The callback must be a valid URL.`,
      ErrorCode.INVALID_CONFIG,
      { field: 'callback' }
    );
  }
}
