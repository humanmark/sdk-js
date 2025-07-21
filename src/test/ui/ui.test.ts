import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HumanmarkSdk } from '../../core/HumanmarkSdk';
import { QRCodeGenerator } from '../../ui/QRCodeGenerator';
import QRCode from 'qrcode';
import { waitForModal, createMockToken } from '../utils/test-helpers';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock DOM methods
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
});

// Mock QRCode module
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(() =>
      Promise.resolve('data:image/png;base64,mock-qr-code')
    ),
    toString: vi.fn(() => Promise.resolve('<svg>mock-qr-svg</svg>')),
  },
}));

describe('HumanmarkSdk UI Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Clean up any existing modals
    const existingModal = document.getElementById(
      'humanmark-verification-modal'
    );
    if (existingModal) {
      document.body.removeChild(existingModal);
    }
  });

  afterEach(() => {
    // Clean up DOM
    const modal = document.getElementById('humanmark-verification-modal');
    if (modal) {
      document.body.removeChild(modal);
    }
  });

  describe('Modal Creation and Display', () => {
    it('should create and show modal on desktop', async () => {
      // Mock desktop user agent
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        writable: true,
      });

      // Mock very slow API response to give us time to check modal
      const slowResponse = new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ receipt: 'test-receipt' }),
          });
        }, 100); // 100ms delay
      });

      mockFetch.mockReturnValueOnce(slowResponse);

      const sdk = new HumanmarkSdk({
        apiKey: 'test-key',
        challengeToken: createMockToken({
          shard: 'us-east-1',
          challenge: 'testChallenge123',
        }),
      });

      // Start verification
      const verifyPromise = sdk.verify();

      // Wait for modal using the helper
      await waitForModal();

      // Check if modal exists
      const modal = document.getElementById('humanmark-verification-modal');
      expect(modal).toBeTruthy();

      if (modal) {
        // Should contain QR code image
        const img = modal.querySelector('img');
        expect(img).toBeTruthy();
        expect(img?.alt).toBe('Humanmark Verification QR Code');
      }

      // Complete the verification
      await verifyPromise;
    });

    it('should create and show modal on mobile', async () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      // Mock slow API response
      const slowResponse = new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ receipt: 'test-receipt' }),
          });
        }, 100);
      });

      mockFetch.mockReturnValueOnce(slowResponse);

      const sdk = new HumanmarkSdk({
        apiKey: 'test-key',
        challengeToken: createMockToken({
          shard: 'us-east-1',
          challenge: 'testChallenge123',
        }),
      });

      // Start verification
      const verifyPromise = sdk.verify();

      // Wait for modal creation
      await new Promise(resolve => setTimeout(resolve, 20));

      let modal = document.getElementById('humanmark-verification-modal');

      // Debug logging
      console.log('Mobile test - Modal found:', !!modal);

      if (!modal) {
        await new Promise(resolve => setTimeout(resolve, 30));
        modal = document.getElementById('humanmark-verification-modal');
        console.log('Mobile test - Modal found after wait:', !!modal);
      }

      expect(modal).toBeTruthy();

      if (modal) {
        // Should contain verify button (not the close button)
        const buttons = modal.querySelectorAll('button');
        const verifyButton = Array.from(buttons).find(btn =>
          btn.textContent?.includes('Verify with Humanmark')
        );
        expect(verifyButton).toBeTruthy();
        expect(verifyButton?.textContent).toContain('Verify with Humanmark');
      }

      // Complete the verification
      await verifyPromise;
    });

    it('should test UIManager directly', async () => {
      const { UIManager } = await import('../../ui/UIManager');

      const uiManager = new UIManager();

      // Test showing modal directly
      await uiManager.showVerificationModal(
        createMockToken({
          shard: 'us-east-1',
          challenge: 'testChallengeDirect',
        })
      );

      const modal = document.getElementById('humanmark-verification-modal');
      expect(modal).toBeTruthy();

      // Clean up - use immediate to skip animation in tests
      uiManager.hideModal(true);
    });

    it('should test QR code generation directly', async () => {
      const { QRCodeGenerator } = await import('../../ui/QRCodeGenerator');

      const qrImg = await QRCodeGenerator.generateQRCodeElement(
        createMockToken({
          shard: 'us-east-1',
          challenge: 'testChallenge',
        })
      );
      expect(qrImg).toBeTruthy();
      expect(qrImg.tagName).toBe('IMG');
      expect(qrImg.alt).toBe('Humanmark Verification QR Code');
    });
  });

  describe('QR Code Content', () => {
    it('should generate QR code with correct deep link URL', async () => {
      const mockToString = vi.mocked(QRCode.toString);

      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'testChallenge123',
      });
      await QRCodeGenerator.generateQRCode(token);

      // Verify the QR code was generated with the full deep link URL
      expect(mockToString).toHaveBeenCalledWith(
        `https://humanmark.app/verify?token=${encodeURIComponent(token)}`,
        expect.objectContaining({
          type: 'svg',
          errorCorrectionLevel: 'M',
          width: 256,
          margin: 2,
          color: {
            dark: '#7C63FF',
            light: '#FFFFFF',
          },
        })
      );
    });

    it('should generate QR code element with correct deep link URL', async () => {
      const mockToString = vi.mocked(QRCode.toString);

      const token = createMockToken({
        shard: 'eu-west-1',
        challenge: 'myChallenge456',
      });
      await QRCodeGenerator.generateQRCodeElement(token);

      // Verify the QR code was generated with the full deep link URL
      expect(mockToString).toHaveBeenCalledWith(
        `https://humanmark.app/verify?token=${encodeURIComponent(token)}`,
        expect.any(Object)
      );
    });
  });

  describe('Modal Cleanup', () => {
    it('should clean up modal after verification completes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ receipt: 'test-receipt' }),
      });

      const sdk = new HumanmarkSdk({
        apiKey: 'test-key',
        challengeToken: createMockToken({
          shard: 'us-east-1',
          challenge: 'testChallenge123',
        }),
      });

      await sdk.verify();

      // Wait for success animation and modal cleanup (300ms fade out + 1500ms success display + 300ms close animation)
      await new Promise(resolve => setTimeout(resolve, 2200));

      // Modal should be cleaned up
      const modal = document.getElementById('humanmark-verification-modal');
      expect(modal).toBeFalsy();
    });
  });
});
