/**
 * Test Data Builders
 * Builder pattern implementations for creating test data
 */

import type {
  CreateChallengeResponse,
  WaitResponse,
  HumanmarkConfig,
} from '@/types';
import { createMockToken } from './test-helpers';
import type { ChallengeTokenClaims } from '@/utils/challengeToken';

/**
 * Builder for creating challenge responses
 */
export class ChallengeResponseBuilder {
  private claims: Partial<ChallengeTokenClaims> = {
    shard: 'us-east-1',
    challenge: 'testChallenge123',
    exp: Math.floor((Date.now() + 300000) / 1000), // 5 minutes from now
  };

  withChallenge(challenge: string): this {
    this.claims.challenge = challenge;
    return this;
  }

  withShard(shard: string): this {
    this.claims.shard = shard;
    return this;
  }

  withRegion(region: string): this {
    // For backwards compatibility, region maps to shard
    return this.withShard(region);
  }

  withExpiresAt(timestamp: number): this {
    this.claims.exp = Math.floor(timestamp / 1000);
    return this;
  }

  withExpiresInMinutes(minutes: number): this {
    this.claims.exp = Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
    return this;
  }

  expired(): this {
    this.claims.exp = Math.floor((Date.now() - 1000) / 1000); // 1 second ago
    return this;
  }

  build(): CreateChallengeResponse {
    return {
      token: createMockToken(this.claims),
    };
  }
}

/**
 * Builder for creating wait responses
 */
export class WaitResponseBuilder {
  private data: WaitResponse = {
    token: 'verification-token-456',
  };

  withToken(token: string): this {
    this.data.token = token;
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
    domain: 'example.com',
  };

  withApiKey(apiKey: string): this {
    this.data.apiKey = apiKey;
    return this;
  }

  withApiSecret(apiSecret: string): this {
    this.data.apiSecret = apiSecret;
    return this;
  }

  withChallengeToken(challengeToken: string): this {
    this.data.challengeToken = challengeToken;
    return this;
  }

  withDomain(domain: string): this {
    this.data.domain = domain;
    return this;
  }

  withBaseUrl(baseUrl: string): this {
    this.data.baseUrl = baseUrl;
    return this;
  }

  /**
   * Creates a config for create & verify mode
   */
  forCreateAndVerifyMode(): this {
    this.data.apiSecret = 'test-api-secret';
    delete this.data.challengeToken;
    return this;
  }

  /**
   * Creates a config for verify-only mode
   */
  forVerifyOnlyMode(token?: string): this {
    this.data.challengeToken =
      token ??
      createMockToken({
        shard: 'us-east-1',
        challenge: 'existingChallenge456',
      });
    delete this.data.apiSecret;
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
   * Creates a standard challenge response
   */
  challengeResponse: (): CreateChallengeResponse =>
    new ChallengeResponseBuilder().build(),

  /**
   * Creates an expired challenge response
   */
  expiredChallenge: (): CreateChallengeResponse =>
    new ChallengeResponseBuilder().expired().build(),

  /**
   * Creates a wait response with token
   */
  waitResponse: (): WaitResponse => new WaitResponseBuilder().build(),

  /**
   * Creates a config for create & verify mode
   */
  createAndVerifyConfig: (): HumanmarkConfig =>
    new HumanmarkConfigBuilder().forCreateAndVerifyMode().build(),

  /**
   * Creates a config for verify-only mode
   */
  verifyOnlyConfig: (token?: string): HumanmarkConfig =>
    new HumanmarkConfigBuilder().forVerifyOnlyMode(token).build(),
};
