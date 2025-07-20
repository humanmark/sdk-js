import QRCode from 'qrcode';
import { DeepLinkHandler } from './DeepLinkHandler';
import { HumanmarkError } from '@/errors/HumanmarkError';
import { ErrorCode } from '@/types/errors';
import {
  DIMENSIONS,
  COLORS,
  CSS_CLASSES,
  MESSAGES,
  QR_CONFIG,
} from '@/constants/ui';

/**
 * Options for QR code generation
 */
export interface QRCodeOptions {
  /** Width of the QR code in pixels (default: 256) */
  width?: number;
  /** Margin around the QR code in modules (default: 2) */
  margin?: number;
  /** Color configuration */
  color?: {
    /** Foreground color (default: #000000) */
    dark?: string;
    /** Background color (default: #FFFFFF) */
    light?: string;
  };
}

/**
 * Generates QR codes for desktop verification flow
 *
 * Creates QR codes that encode deep links to the Humanmark app.
 * Users scan the code with their mobile device to complete verification.
 */
export class QRCodeGenerator {
  private static readonly DEFAULT_OPTIONS: QRCodeOptions = {
    width: DIMENSIONS.QR_CODE_WIDTH,
    margin: DIMENSIONS.QR_CODE_MARGIN,
    color: {
      dark: COLORS.QR_CODE.DARK,
      light: COLORS.QR_CODE.WHITE,
    },
  };

  /**
   * Generates a QR code as an SVG data URL
   *
   * @param token - Challenge token to encode in the QR code
   * @param options - Optional QR code styling options
   * @returns Promise resolving to SVG data URL of the QR code
   * @throws {Error} If QR code generation fails
   *
   * @example
   * const dataUrl = await QRCodeGenerator.generateQRCode('eyJhbGciOi...');
   * // dataUrl can be used as src for an img element
   */
  static async generateQRCode(
    token: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Generate the full deep link URL for the QR code
      const deepLinkURL = DeepLinkHandler.generateVerifyLink(token);

      // Generate SVG string
      const svgString = await QRCode.toString(deepLinkURL, {
        type: 'svg',
        width: mergedOptions.width,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION_LEVEL,
      });

      // Convert SVG to data URL
      const encodedSVG = encodeURIComponent(svgString);
      return `data:image/svg+xml;charset=utf-8,${encodedSVG}`;
    } catch (error) {
      throw new HumanmarkError(
        `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.QR_CODE_GENERATION_FAILED
      );
    }
  }

  /**
   * Generates a QR code as an HTML image element
   *
   * @param token - Challenge token to encode in the QR code
   * @param options - Optional QR code styling options
   * @returns Promise resolving to an img element ready to be inserted into DOM
   * @throws {Error} If QR code generation fails
   *
   * @example
   * const img = await QRCodeGenerator.generateQRCodeElement('eyJhbGciOi...');
   * document.body.appendChild(img);
   */
  static async generateQRCodeElement(
    token: string,
    options: QRCodeOptions = {}
  ): Promise<HTMLImageElement> {
    const dataURL = await this.generateQRCode(token, options);

    // Validate that the generated URL is a data URL before assignment
    if (!dataURL.startsWith('data:image/svg+xml')) {
      throw new HumanmarkError(
        'Invalid QR code data URL generated',
        ErrorCode.QR_CODE_GENERATION_FAILED
      );
    }

    const img = document.createElement('img');
    // eslint-disable-next-line no-restricted-syntax -- Safe: Validated data URL from trusted QR code library
    img.src = dataURL;
    img.alt = MESSAGES.ACCESSIBILITY.QR_ALT_TEXT;
    img.className = CSS_CLASSES.QR_CODE.IMAGE;

    return img;
  }
}
