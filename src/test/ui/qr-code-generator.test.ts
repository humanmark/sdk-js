import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QRCodeGenerator } from '../../ui/QRCodeGenerator';
import { HumanmarkError } from '../../errors';
import QRCode from 'qrcode';
import { createMockToken } from '../utils/test-helpers';

// Mock QRCode module
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
    toString: vi.fn(),
  },
}));

describe('QRCodeGenerator', () => {
  const mockToDataURL = QRCode.toDataURL as unknown as ReturnType<typeof vi.fn>;
  const mockToString = QRCode.toString as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockToDataURL.mockReset();
    mockToString.mockReset();
    mockToDataURL.mockResolvedValue('data:image/png;base64,mock-qr-code');
    mockToString.mockResolvedValue('<svg>mock-qr-svg</svg>');
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully with challenge token', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-east-1',
        challenge: 'test123',
      });

      // Act
      const result = await QRCodeGenerator.generateQRCode(token);

      // Assert
      expect(result).toBe(
        'data:image/svg+xml;charset=utf-8,%3Csvg%3Emock-qr-svg%3C%2Fsvg%3E'
      );
      expect(mockToString).toHaveBeenCalledWith(
        `https://humanmark.app/verify?token=${encodeURIComponent(token)}`,
        expect.objectContaining({
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 256,
          color: {
            dark: '#7C63FF',
            light: '#FFFFFF',
          },
        })
      );
    });

    it('should throw HumanmarkError when QR generation fails', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'eu-west-1',
        challenge: 'test123',
      });
      const error = new Error('QR generation failed');
      mockToString.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(QRCodeGenerator.generateQRCode(token)).rejects.toThrow(
        HumanmarkError
      );
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'ap-southeast-1',
        challenge: 'test123',
      });
      mockToString.mockRejectedValueOnce('String error');

      // Act & Assert
      await expect(QRCodeGenerator.generateQRCode(token)).rejects.toThrow(
        'Failed to generate QR code: Unknown error'
      );
    });

    it('should pass custom options to QRCode library', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'us-west-2',
        challenge: 'test123',
      });
      const customOptions = {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      };

      // Act
      await QRCodeGenerator.generateQRCode(token, customOptions);

      // Assert
      expect(mockToString).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'svg',
          width: 512,
          margin: 2,
          color: customOptions.color,
        })
      );
    });
  });

  describe('generateQRCodeElement', () => {
    it('should create img element with QR code', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'ca-central-1',
        challenge: 'test123',
      });

      // Act
      const img = await QRCodeGenerator.generateQRCodeElement(token);

      // Assert
      expect(img.tagName).toBe('IMG');
      expect(img.src).toBe(
        'data:image/svg+xml;charset=utf-8,%3Csvg%3Emock-qr-svg%3C%2Fsvg%3E'
      );
      expect(img.alt).toBe('Humanmark Verification QR Code');
      expect(img.className).toBe('humanmark-qr-image');
    });

    it('should create img element with SVG data URL', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'eu-central-1',
        challenge: 'test123',
      });
      const customSvg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
      mockToString.mockResolvedValueOnce(customSvg);

      // Act
      const img = await QRCodeGenerator.generateQRCodeElement(token);

      // Assert
      expect(img.src).toBe(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(customSvg)}`
      );
    });

    it('should handle QR generation errors', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'ap-northeast-1',
        challenge: 'test123',
      });
      mockToString.mockRejectedValueOnce(new Error('Generation failed'));

      // Act & Assert
      await expect(
        QRCodeGenerator.generateQRCodeElement(token)
      ).rejects.toThrow('Failed to generate QR code: Generation failed');
    });

    it('should pass options through to generateQRCode', async () => {
      // Arrange
      const token = createMockToken({
        shard: 'sa-east-1',
        challenge: 'test123',
      });
      const options = { width: 400 };

      // Act
      await QRCodeGenerator.generateQRCodeElement(token, options);

      // Assert
      expect(mockToString).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'svg',
          width: 400,
        })
      );
    });
  });
});
