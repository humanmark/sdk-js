import { describe, it, expect, vi } from 'vitest';
import { HumanmarkSdk } from '@/core/HumanmarkSdk';
import { HumanmarkConfigError } from '@/errors/HumanmarkError';

// Mock modules
vi.mock('@/ui/ThemeManager', () => ({
  ThemeManager: {
    initialize: vi.fn(),
  },
}));

describe('HumanmarkSdk - Callback Support', () => {
  const validConfig = {
    apiKey: 'test-api-key',
    challengeToken: 'us-east-1_validToken123',
  };

  describe('Constructor - Callback Validation', () => {
    it('should accept valid web URLs as callback', () => {
      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            callback: 'https://example.com/callback',
          })
      ).not.toThrow();

      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            callback: 'https://example.com/callback?session=123',
          })
      ).not.toThrow();

      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            callback: 'https://example.com/callback#section',
          })
      ).not.toThrow();
    });

    it('should accept custom protocol schemes as callback', () => {
      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            callback: 'myapp://verification/complete',
          })
      ).not.toThrow();

      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            callback: 'com.example.app://return',
          })
      ).not.toThrow();

      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            callback: 'custom-scheme://path?query=value',
          })
      ).not.toThrow();
    });

    it('should reject invalid callback URLs', () => {
      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            callback: 'not a valid url',
          })
      ).toThrow(HumanmarkConfigError);

      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            callback: 'example.com',
          })
      ).toThrow(HumanmarkConfigError);

      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            callback: '//example.com',
          })
      ).toThrow(HumanmarkConfigError);
    });

    it('should reject non-string callback values', () => {
      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            // @ts-expect-error Testing invalid type
            callback: 123,
          })
      ).toThrow(HumanmarkConfigError);

      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            // @ts-expect-error Testing invalid type
            callback: {},
          })
      ).toThrow(HumanmarkConfigError);

      expect(
        () =>
          new HumanmarkSdk({
            ...validConfig,
            // @ts-expect-error Testing invalid type
            callback: [],
          })
      ).toThrow(HumanmarkConfigError);
    });

    it('should work without callback parameter', () => {
      expect(() => new HumanmarkSdk(validConfig)).not.toThrow();
    });

    it('should provide meaningful error messages for invalid callbacks', () => {
      try {
        new HumanmarkSdk({
          ...validConfig,
          callback: 'bad url',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HumanmarkConfigError);
        expect((error as HumanmarkConfigError).message).toContain(
          'Invalid callback URL format'
        );
        expect((error as HumanmarkConfigError).message).toContain('bad url');
      }
    });
  });
});
