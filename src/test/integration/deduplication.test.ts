import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HumanmarkSdk } from '../../core/HumanmarkSdk';
import { createMockToken } from '../utils/test-helpers';

// Mock UI and fetch
vi.mock('@/ui', () => ({
  loadUIManager: vi.fn().mockResolvedValue(
    class MockUIManager {
      private successCallback: (() => void) | null = null;

      showVerificationModal = vi.fn();
      hideModal = vi.fn();
      onModalClosed = vi.fn();
      onSuccess = vi.fn((callback: () => void) => {
        this.successCallback = callback;
      });
      showSuccess = vi.fn(() => {
        // Simulate success animation completion
        if (this.successCallback) {
          setTimeout(() => {
            this.successCallback?.();
          }, 0);
        }
      });
    }
  ),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Request Deduplication', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should only make one API call for concurrent verify calls', async () => {
    const sdk = new HumanmarkSdk({
      apiKey: 'test-key',
      challengeToken: createMockToken({
        shard: 'us-east-1',
        challenge: 'testChallenge123',
      }),
    });

    // Mock successful verification
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => ({ receipt: 'test-receipt' }),
    });

    // Spy on the private method to track calls
    let performVerificationCalls = 0;
    const originalPerform = sdk['performVerification'];
    sdk['performVerification'] = function (...args): Promise<string> {
      performVerificationCalls++;
      return originalPerform.apply(this, args);
    };

    // Call verify multiple times synchronously
    const promise1 = sdk.verify();
    const promise2 = sdk.verify();
    const promise3 = sdk.verify();

    // The important test: performVerification should only be called once
    expect(performVerificationCalls).toBe(1);

    // All promises should resolve to the same receipt
    const [receipt1, receipt2, receipt3] = await Promise.all([
      promise1,
      promise2,
      promise3,
    ]);
    expect(receipt1).toBe('test-receipt');
    expect(receipt2).toBe('test-receipt');
    expect(receipt3).toBe('test-receipt');

    // Should only make one API call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should allow new verify call after previous completes', async () => {
    const sdk = new HumanmarkSdk({
      apiKey: 'test-key',
      challengeToken: createMockToken({
        shard: 'us-east-1',
        challenge: 'testChallenge123',
      }),
    });

    // Mock two successful verifications
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => ({ receipt: 'receipt-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => ({ receipt: 'receipt-2' }),
      });

    // First verification
    const receipt1 = await sdk.verify();
    expect(receipt1).toBe('receipt-1');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second verification should work
    const receipt2 = await sdk.verify();
    expect(receipt2).toBe('receipt-2');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should prevent duplicate API calls in create & verify mode', async () => {
    const sdk = new HumanmarkSdk({
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      domain: 'test.com',
    });

    // Mock challenge creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => ({
        token: createMockToken({
          shard: 'us-east-1',
          challenge: 'newChallenge123',
          exp: Math.floor((Date.now() + 120000) / 1000),
        }),
      }),
    });

    // Mock verification (delayed to simulate real API)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => ({ receipt: 'test-receipt' }),
    });

    // Call verify multiple times
    const promises = [sdk.verify(), sdk.verify(), sdk.verify()];

    // All should get the same receipt
    const receipts = await Promise.all(promises);
    expect(receipts[0]).toBe('test-receipt');
    expect(receipts[1]).toBe('test-receipt');
    expect(receipts[2]).toBe('test-receipt');

    // Should only make 2 API calls (create + verify)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
