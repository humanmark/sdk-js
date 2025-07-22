/**
 * Test Data Builders
 * Builder pattern implementations for creating test data
 */

import type { WaitResponse, HumanmarkConfig } from '@/types';
import { createMockToken } from './test-helpers';

/**
 * Builder for creating wait responses
 */
export class WaitResponseBuilder {
  private data: WaitResponse = {
    receipt: 'verification-receipt-456',
  };

  withReceipt(receipt: string): this {
    this.data.receipt = receipt;
    return this;
  }

  build(): WaitResponse {
    return { ...this.data };
  }
}

/**
 * Builder for creating SDK configurations
 */
export class HumanmarkConfigBuilder {
  private data: Partial<HumanmarkConfig> = {
    apiKey: 'test-api-key',
    challengeToken: 'test-challenge-token',
  };

  withApiKey(apiKey: string): this {
    this.data.apiKey = apiKey;
    return this;
  }

  withChallengeToken(challengeToken: string): this {
    this.data.challengeToken = challengeToken;
    return this;
  }

  withBaseUrl(baseUrl: string): this {
    this.data.baseUrl = baseUrl;
    return this;
  }

  /**
   * Creates a config with a specific challenge token
   */
  withMockChallengeToken(): this {
    this.data.challengeToken = createMockToken({
      shard: 'us-east-1',
      challenge: 'existingChallenge456',
      exp: Math.floor((Date.now() + 300000) / 1000), // 5 minutes from now
    });
    return this;
  }

  /**
   * Creates an invalid config (missing required fields)
   */
  invalid(): this {
    this.data = {};
    return this;
  }

  build(): HumanmarkConfig {
    return this.data as HumanmarkConfig;
  }
}

/**
 * Factory functions for quick test data creation
 */
export const testData = {
  /**
   * Creates a wait response with token
   */
  waitResponse: (): WaitResponse => new WaitResponseBuilder().build(),

  /**
   * Creates a config with pre-created challenge token
   */
  validConfig: (): HumanmarkConfig =>
    new HumanmarkConfigBuilder().withMockChallengeToken().build(),
};
