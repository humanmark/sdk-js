/**
 * Validates challenge ID format
 * Expected format: {region}_{base64url}
 * - region: lowercase letters, numbers, and dashes
 * - base64url: URL-safe base64 encoded string without padding
 */
export function isValidChallengeId(
  challengeId: unknown
): challengeId is string {
  if (typeof challengeId !== 'string') {
    return false;
  }

  // Challenge format: region_base64url
  // Region: lowercase letters, numbers, dashes (no underscores)
  // Base64URL: A-Z, a-z, 0-9, -, _ (no padding)

  // Find the first underscore to split region from base64url
  const firstUnderscoreIndex = challengeId.indexOf('_');
  if (firstUnderscoreIndex === -1 || firstUnderscoreIndex === 0) {
    return false; // No underscore or starts with underscore
  }

  const region = challengeId.substring(0, firstUnderscoreIndex);
  const base64url = challengeId.substring(firstUnderscoreIndex + 1);

  // Ensure both parts are non-empty
  if (!region || !base64url) {
    return false;
  }

  // Validate region part: lowercase letters, numbers, dashes only
  const regionRegex = /^[a-z0-9-]+$/;
  if (!regionRegex.test(region)) {
    return false;
  }

  // Validate base64url part: A-Z, a-z, 0-9, -, _
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  return base64urlRegex.test(base64url);
}
