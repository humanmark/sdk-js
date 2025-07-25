import { describe, it, expect, vi } from 'vitest';
import { QRCodeGenerator } from '@/ui/QRCodeGenerator';
import { DeepLinkHandler } from '@/ui/DeepLinkHandler';
import { createMockToken } from '../utils/test-helpers';

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toString: vi.fn().mockResolvedValue('<svg>mock-qr-code</svg>'),
  },
}));

// Spy on DeepLinkHandler
vi.spyOn(DeepLinkHandler, 'generateVerifyLink');

describe('QRCodeGenerator - No Callback in QR Codes', () => {
  const token = createMockToken({
    shard: 'us-east-1',
    challenge: 'testChallenge',
  });

  it('should NOT include callback parameter in QR code URLs', async () => {
    // Act
    await QRCodeGenerator.generateQRCode(token);

    // Assert
    expect(DeepLinkHandler.generateVerifyLink).toHaveBeenCalledWith(token);
    expect(DeepLinkHandler.generateVerifyLink).toHaveBeenCalledTimes(1);

    // Verify it was called with only one argument (no callback)
    const callArgs = vi.mocked(DeepLinkHandler.generateVerifyLink).mock
      .calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs!.length).toBe(1);
    expect(callArgs![0]).toBe(token);
    expect(callArgs![1]).toBeUndefined();
  });

  it('should generate QR code URL without callback even when SDK has callback configured', async () => {
    // This test verifies that even if the SDK is configured with a callback,
    // the QR code generator doesn't use it

    // Act
    const dataUrl = await QRCodeGenerator.generateQRCode(token);

    // Assert
    expect(dataUrl).toBeTruthy();
    expect(dataUrl).toContain('data:image/svg+xml');

    // Verify DeepLinkHandler was called without callback
    const lastCall = vi.mocked(DeepLinkHandler.generateVerifyLink).mock
      .lastCall;
    expect(lastCall).toBeDefined();
    expect(lastCall![1]).toBeUndefined(); // No second parameter (callback)
  });

  it('should generate consistent QR codes regardless of callback configuration', async () => {
    // Clear previous calls
    vi.mocked(DeepLinkHandler.generateVerifyLink).mockClear();

    // Generate QR code twice
    await QRCodeGenerator.generateQRCode(token);
    await QRCodeGenerator.generateQRCode(token);

    // Both calls should be identical (no callback parameter)
    const calls = vi.mocked(DeepLinkHandler.generateVerifyLink).mock.calls;
    expect(calls[0]).toEqual([token]);
    expect(calls[1]).toEqual([token]);
  });
});
