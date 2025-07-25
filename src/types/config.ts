/**
 * Configuration for the Humanmark SDK
 *
 * The SDK requires a pre-created challenge token from your backend.
 * Never expose API secrets in client-side code.
 */
export interface HumanmarkConfig {
  /**
   * Your Humanmark API key
   * Required for all SDK operations
   */
  apiKey: string;

  /**
   * Pre-created challenge token
   * Required - must be obtained from your backend
   * @example 'us-east-1_base64url...'
   */
  challengeToken: string;

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

  /**
   * Optional callback URL for mobile deep links
   * When provided, the Humanmark app will redirect back to this URL
   * after successful verification with the receipt as a query parameter.
   *
   * This is only used for mobile deep links, not QR codes.
   * Supports custom protocol schemes for native app deep linking.
   *
   * @example 'https://example.com/verify/complete'
   * @example 'myapp://verification/done'
   * @example 'com.example.app://return?session=123'
   */
  callback?: string;
}
