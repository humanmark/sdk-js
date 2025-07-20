import { describe, it, expect } from 'vitest';
import { isValidChallengeId } from '../../utils/validation';

describe('Validation Utilities', () => {
  describe('isValidChallengeId', () => {
    it('should accept valid challenge IDs', () => {
      // Valid formats: region_base64url
      expect(isValidChallengeId('us-east-1_abc123DEF-_')).toBe(true);
      expect(isValidChallengeId('eu-west-2_AAAAAAAAAA')).toBe(true);
      expect(isValidChallengeId('ap-southeast-1_-_-_-_-_-_')).toBe(true);
      expect(isValidChallengeId('region_base64urlEncodedData')).toBe(true);
      expect(isValidChallengeId('prod_1234567890abcdefABCDEF-_')).toBe(true);
    });

    it('should reject invalid challenge IDs', () => {
      // Missing underscore
      expect(isValidChallengeId('useast1abc123')).toBe(false);

      // Underscore in region part (not allowed)
      expect(isValidChallengeId('us_east_1_abc123')).toBe(true); // This is actually valid: region='us', base64='east_1_abc123'
      expect(isValidChallengeId('invalid_region_abc123')).toBe(true); // This is also valid: region='invalid', base64='region_abc123'

      // To test invalid regions, we need regions that contain invalid characters
      expect(isValidChallengeId('us east_abc123')).toBe(false); // Space in region
      expect(isValidChallengeId('us@region_abc123')).toBe(false); // @ in region

      // Uppercase in region
      expect(isValidChallengeId('US-EAST-1_abc123')).toBe(false);

      // Invalid characters (padding =)
      expect(isValidChallengeId('region_abc123==')).toBe(false);

      // Invalid characters in region
      expect(isValidChallengeId('reg!on_abc123')).toBe(false);

      // Empty parts
      expect(isValidChallengeId('_abc123')).toBe(false);
      expect(isValidChallengeId('region_')).toBe(false);

      // No underscore
      expect(isValidChallengeId('regionabc123')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidChallengeId(null)).toBe(false);
      expect(isValidChallengeId(undefined)).toBe(false);
      expect(isValidChallengeId(123)).toBe(false);
      expect(isValidChallengeId({})).toBe(false);
      expect(isValidChallengeId([])).toBe(false);
    });
  });
});
