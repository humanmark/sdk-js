import { describe, it, expect, vi } from 'vitest';
import {
  createSuccessCheckmarkSVG,
  createLoadingSpinnerSVG,
  createErrorIconSVG,
  createWarningIconSVG,
} from '../../ui/SVGBuilder';
import { SVG_DIMENSIONS } from '../../constants/ui';

// Mock createSVGElement from dom utils
vi.mock('@/utils/dom', () => ({
  createSVGElement: vi.fn((tag: string, attrs: Record<string, string>) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }),
}));

describe('SVGBuilder', () => {
  describe('createSuccessCheckmarkSVG', () => {
    it('should create SVG with correct structure', () => {
      // Act
      const svg = createSuccessCheckmarkSVG();

      // Assert
      expect(svg.tagName.toLowerCase()).toBe('svg');
      expect(svg.getAttribute('viewBox')).toBe(SVG_DIMENSIONS.VIEWBOX);

      const circle = svg.querySelector('circle');
      expect(circle).toBeTruthy();
      expect(circle?.getAttribute('class')).toBe('checkmark-circle');
      expect(circle?.getAttribute('cx')).toBe(SVG_DIMENSIONS.CIRCLE.CX);
      expect(circle?.getAttribute('cy')).toBe(SVG_DIMENSIONS.CIRCLE.CY);
      expect(circle?.getAttribute('r')).toBe(SVG_DIMENSIONS.CIRCLE.R);
      expect(circle?.getAttribute('fill')).toBe('none');

      const path = svg.querySelector('path');
      expect(path).toBeTruthy();
      expect(path?.getAttribute('class')).toBe('checkmark-check');
      expect(path?.getAttribute('d')).toBe(SVG_DIMENSIONS.CHECK_PATH);
      expect(path?.getAttribute('fill')).toBe('none');
    });

    it('should have correct child element order', () => {
      // Act
      const svg = createSuccessCheckmarkSVG();

      // Assert
      expect(svg.children.length).toBe(2);
      expect(svg.children[0]?.tagName.toLowerCase()).toBe('circle');
      expect(svg.children[1]?.tagName.toLowerCase()).toBe('path');
    });
  });

  describe('createLoadingSpinnerSVG', () => {
    it('should create loading spinner with default size', () => {
      // Act
      const svg = createLoadingSpinnerSVG();

      // Assert
      expect(svg.tagName.toLowerCase()).toBe('svg');
      expect(svg.getAttribute('width')).toBe('24');
      expect(svg.getAttribute('height')).toBe('24');
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg.getAttribute('class')).toBe('humanmark-spinner');

      const circle = svg.querySelector('circle');
      expect(circle).toBeTruthy();
      expect(circle?.getAttribute('cx')).toBe('12');
      expect(circle?.getAttribute('cy')).toBe('12');
      expect(circle?.getAttribute('r')).toBe('10');
      expect(circle?.getAttribute('stroke')).toBe('currentColor');
      expect(circle?.getAttribute('stroke-width')).toBe('3');
      expect(circle?.getAttribute('fill')).toBe('none');
      expect(circle?.getAttribute('stroke-dasharray')).toBe('60');
      expect(circle?.getAttribute('stroke-dashoffset')).toBe('0');
      expect(circle?.getAttribute('stroke-linecap')).toBe('round');
    });

    it('should create loading spinner with custom size', () => {
      // Act
      const customSize = 48;
      const svg = createLoadingSpinnerSVG(customSize);

      // Assert
      expect(svg.getAttribute('width')).toBe('48');
      expect(svg.getAttribute('height')).toBe('48');
    });
  });

  describe('createErrorIconSVG', () => {
    it('should create error icon with default size', () => {
      // Act
      const svg = createErrorIconSVG();

      // Assert
      expect(svg.tagName.toLowerCase()).toBe('svg');
      expect(svg.getAttribute('width')).toBe('24');
      expect(svg.getAttribute('height')).toBe('24');
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg.getAttribute('class')).toBe('humanmark-error-icon');

      const circle = svg.querySelector('circle');
      expect(circle).toBeTruthy();
      expect(circle?.getAttribute('cx')).toBe('12');
      expect(circle?.getAttribute('cy')).toBe('12');
      expect(circle?.getAttribute('r')).toBe('10');
      expect(circle?.getAttribute('fill')).toBe('#FF6B6B');

      const path = svg.querySelector('path');
      expect(path).toBeTruthy();
      expect(path?.getAttribute('d')).toBe('M15 9L9 15M9 9L15 15');
      expect(path?.getAttribute('stroke')).toBe('#FFFFFF');
      expect(path?.getAttribute('stroke-width')).toBe('2');
      expect(path?.getAttribute('stroke-linecap')).toBe('round');
    });

    it('should create error icon with custom size', () => {
      // Act
      const customSize = 32;
      const svg = createErrorIconSVG(customSize);

      // Assert
      expect(svg.getAttribute('width')).toBe('32');
      expect(svg.getAttribute('height')).toBe('32');
    });

    it('should have correct child element order', () => {
      // Act
      const svg = createErrorIconSVG();

      // Assert
      expect(svg.children.length).toBe(2);
      expect(svg.children[0]?.tagName.toLowerCase()).toBe('circle');
      expect(svg.children[1]?.tagName.toLowerCase()).toBe('path');
    });
  });

  describe('createWarningIconSVG', () => {
    it('should create warning icon with default size', () => {
      // Act
      const svg = createWarningIconSVG();

      // Assert
      expect(svg.tagName.toLowerCase()).toBe('svg');
      expect(svg.getAttribute('width')).toBe('24');
      expect(svg.getAttribute('height')).toBe('24');
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg.getAttribute('class')).toBe('humanmark-warning-icon');

      const path = svg.querySelector('path');
      expect(path).toBeTruthy();
      expect(path?.getAttribute('d')).toBe('M12 2L2 20h20L12 2z');
      expect(path?.getAttribute('fill')).toBe('#FFB74D');
      expect(path?.getAttribute('stroke')).toBe('#FFB74D');
      expect(path?.getAttribute('stroke-width')).toBe('1');
      expect(path?.getAttribute('stroke-linejoin')).toBe('round');

      const line = svg.querySelector('line');
      expect(line).toBeTruthy();
      expect(line?.getAttribute('x1')).toBe('12');
      expect(line?.getAttribute('y1')).toBe('9');
      expect(line?.getAttribute('x2')).toBe('12');
      expect(line?.getAttribute('y2')).toBe('13');
      expect(line?.getAttribute('stroke')).toBe('#FFFFFF');
      expect(line?.getAttribute('stroke-width')).toBe('2');
      expect(line?.getAttribute('stroke-linecap')).toBe('round');

      const circle = svg.querySelector('circle');
      expect(circle).toBeTruthy();
      expect(circle?.getAttribute('cx')).toBe('12');
      expect(circle?.getAttribute('cy')).toBe('16');
      expect(circle?.getAttribute('r')).toBe('1');
      expect(circle?.getAttribute('fill')).toBe('#FFFFFF');
    });

    it('should create warning icon with custom size', () => {
      // Act
      const customSize = 36;
      const svg = createWarningIconSVG(customSize);

      // Assert
      expect(svg.getAttribute('width')).toBe('36');
      expect(svg.getAttribute('height')).toBe('36');
    });

    it('should have correct child element order', () => {
      // Act
      const svg = createWarningIconSVG();

      // Assert
      expect(svg.children.length).toBe(3);
      expect(svg.children[0]?.tagName.toLowerCase()).toBe('path');
      expect(svg.children[1]?.tagName.toLowerCase()).toBe('line');
      expect(svg.children[2]?.tagName.toLowerCase()).toBe('circle');
    });
  });
});
