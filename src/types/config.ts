/**
 * Configuration for the Humanmark SDK
 *
 * The SDK supports two modes of operation:
 * 1. Create & Verify mode - requires apiKey and apiSecret
 * 2. Verify-only mode - requires apiKey and challenge token
 */
export interface HumanmarkConfig {
  /**
   * Your Humanmark API key
   * Required for all SDK operations
   */
  apiKey: string;

  /**
   * The domain associated with your application
   * Used for challenge creation and verification
   * @example 'example.com'
   */
  domain: string;

  /**
   * Your Humanmark API secret
   * Required for Create & Verify mode
   * Not needed for Verify-only mode
   */
  apiSecret?: string;

  /**
   * Pre-created challenge token
   * Required for Verify-only mode
   * Should be obtained from your backend
   */
  challengeToken?: string;

  /**
   * Base URL for API requests
   * @default 'https://humanmark.io'
   * @example 'https://staging.humanmark.io'
   */
  baseUrl?: string;

  /**
   * Theme for the verification modal
   * @default 'dark'
   * - 'light': Light theme with white backgrounds
   * - 'dark': Dark theme with dark backgrounds
   * - 'auto': Follows system preference
   */
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * SDK initialization mode derived from config
 */
export type SDKMode = 'create-and-verify' | 'verify-only';

/**
 * Type guard to check if config is for create & verify mode
 */
export function isCreateAndVerifyMode(
  config: HumanmarkConfig
): config is HumanmarkConfig & Required<Pick<HumanmarkConfig, 'apiSecret'>> {
  return config.apiSecret !== undefined;
}

/**
 * Type guard to check if config is for verify-only mode
 */
export function isVerifyOnlyMode(
  config: HumanmarkConfig
): config is HumanmarkConfig &
  Required<Pick<HumanmarkConfig, 'challengeToken'>> {
  return config.challengeToken !== undefined && !config.apiSecret;
}
