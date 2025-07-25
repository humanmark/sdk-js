import { describe, it, expect } from 'vitest';
import { isValidUrl, validateCallbackUrl } from '@/utils/validation';
import { HumanmarkConfigError } from '@/errors/HumanmarkError';

describe('URL Validation', () => {
  describe('isValidUrl', () => {
    it('should validate standard web URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
      expect(isValidUrl('https://example.com/path#fragment')).toBe(true);
      expect(isValidUrl('https://example.com:8080/path')).toBe(true);
    });

    it('should validate custom protocol schemes', () => {
      expect(isValidUrl('myapp://callback')).toBe(true);
      expect(isValidUrl('com.example.app://return')).toBe(true);
      expect(isValidUrl('custom-scheme://path/to/resource')).toBe(true);
      expect(isValidUrl('app://verify?status=complete')).toBe(true);
    });

    it('should validate URLs with existing query parameters', () => {
      expect(isValidUrl('https://example.com/callback?session=123')).toBe(true);
      expect(isValidUrl('myapp://return?user=abc&session=xyz')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('//example.com')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      // eslint-disable-next-line no-script-url
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('validateCallbackUrl', () => {
    it('should not throw for valid URLs', () => {
      expect(() => validateCallbackUrl('https://example.com')).not.toThrow();
      expect(() => validateCallbackUrl('myapp://callback')).not.toThrow();
    });

    it('should throw HumanmarkConfigError for invalid URLs', () => {
      expect(() => validateCallbackUrl('not a url')).toThrow(
        HumanmarkConfigError
      );
      expect(() => validateCallbackUrl('not a url')).toThrow(
        /Invalid callback URL format/
      );
    });

    it('should include the invalid URL in the error message', () => {
      try {
        validateCallbackUrl('bad url');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HumanmarkConfigError);
        expect((error as HumanmarkConfigError).message).toContain('bad url');
      }
    });
  });
});
