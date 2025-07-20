import { describe, it, expect, beforeEach } from 'vitest';
import {
  querySelector,
  querySelectorOrThrow,
  removeAllChildren,
  createElement,
  createSVGElement,
  addClass,
  removeClass,
  toggleClass,
  isInDOM,
  createTextNode,
  setAttributes,
  focusElement,
  appendChildren,
} from '../../utils/dom';

describe('DOM Utilities', () => {
  beforeEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  describe('querySelector', () => {
    it('should find element by selector', () => {
      // Arrange
      const div = document.createElement('div');
      div.className = 'test-class';
      document.body.appendChild(div);

      // Act
      const result = querySelector<HTMLDivElement>(
        document.body,
        '.test-class'
      );

      // Assert
      expect(result).toBe(div);
    });

    it('should return null when element not found', () => {
      // Act
      const result = querySelector<HTMLDivElement>(document.body, '.not-found');

      // Assert
      expect(result).toBeNull();
    });

    it('should work with parent element', () => {
      // Arrange
      const parent = document.createElement('div');
      const child = document.createElement('span');
      child.id = 'test-span';
      parent.appendChild(child);
      document.body.appendChild(parent);

      // Act
      const result = querySelector<HTMLSpanElement>(parent, '#test-span');

      // Assert
      expect(result).toBe(child);
    });
  });

  describe('querySelectorOrThrow', () => {
    it('should find element by selector', () => {
      // Arrange
      const button = document.createElement('button');
      button.id = 'test-button';
      document.body.appendChild(button);

      // Act
      const result = querySelectorOrThrow<HTMLButtonElement>(
        document,
        '#test-button'
      );

      // Assert
      expect(result).toBe(button);
    });

    it('should throw when element not found', () => {
      // Act & Assert
      expect(() =>
        querySelectorOrThrow<HTMLDivElement>(document.body, '.not-found')
      ).toThrow('Element not found: .not-found');
    });

    it('should use custom error message', () => {
      // Act & Assert
      expect(() =>
        querySelectorOrThrow<HTMLDivElement>(
          document.body,
          '.not-found',
          'Custom error'
        )
      ).toThrow('Custom error');
    });
  });

  describe('removeAllChildren', () => {
    it('should remove all child elements', () => {
      // Arrange
      const parent = document.createElement('div');
      for (let i = 1; i <= 3; i++) {
        const span = document.createElement('span');
        span.textContent = String(i);
        parent.appendChild(span);
      }
      expect(parent.children.length).toBe(3);

      // Act
      removeAllChildren(parent);

      // Assert
      expect(parent.children.length).toBe(0);
      expect(parent.textContent).toBe('');
    });

    it('should handle empty parent', () => {
      // Arrange
      const parent = document.createElement('div');

      // Act & Assert - should not throw
      expect(() => removeAllChildren(parent)).not.toThrow();
      expect(parent.children.length).toBe(0);
    });

    it('should remove text nodes', () => {
      // Arrange
      const parent = document.createElement('div');
      parent.appendChild(document.createTextNode('Text 1'));
      parent.appendChild(document.createElement('span'));
      parent.appendChild(document.createTextNode('Text 2'));

      // Act
      removeAllChildren(parent);

      // Assert
      expect(parent.childNodes.length).toBe(0);
    });
  });

  describe('createElement', () => {
    it('should create element with tag name only', () => {
      // Act
      const element = createElement('div');

      // Assert
      expect(element.tagName).toBe('DIV');
      expect(element.className).toBe('');
    });

    it('should create element with className', () => {
      // Act
      const element = createElement('button', {
        className: 'btn btn-primary',
      });

      // Assert
      expect(element.tagName).toBe('BUTTON');
      expect(element.className).toBe('btn btn-primary');
    });

    it('should create element with attributes', () => {
      // Act
      const element = createElement('input', {
        attributes: {
          type: 'text',
          placeholder: 'Enter text',
          'data-testid': 'test-input',
        },
      });

      // Assert
      expect(element.getAttribute('type')).toBe('text');
      expect(element.getAttribute('placeholder')).toBe('Enter text');
      expect(element.getAttribute('data-testid')).toBe('test-input');
    });

    it('should create element with textContent', () => {
      // Act
      const element = createElement('p', {
        textContent: 'Hello World',
      });

      // Assert
      expect(element.textContent).toBe('Hello World');
    });

    it('should create element with all options', () => {
      // Act
      const element = createElement('a', {
        className: 'link',
        attributes: { href: '#', target: '_blank' },
        textContent: 'Click me',
      });

      // Assert
      expect(element.className).toBe('link');
      expect(element.getAttribute('href')).toBe('#');
      expect(element.getAttribute('target')).toBe('_blank');
      expect(element.textContent).toBe('Click me');
    });
  });

  describe('createSVGElement', () => {
    it('should create SVG element with proper namespace', () => {
      // Act
      const svg = createSVGElement('svg');

      // Assert
      expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(svg.tagName).toBe('svg');
    });

    it('should create SVG element with attributes', () => {
      // Act
      const circle = createSVGElement('circle', {
        cx: '50',
        cy: '50',
        r: '40',
        fill: 'red',
      });

      // Assert
      expect(circle.getAttribute('cx')).toBe('50');
      expect(circle.getAttribute('cy')).toBe('50');
      expect(circle.getAttribute('r')).toBe('40');
      expect(circle.getAttribute('fill')).toBe('red');
    });
  });

  describe('addClass', () => {
    it('should add class to element', () => {
      // Arrange
      const element = document.createElement('div');

      // Act
      addClass(element, 'test-class');

      // Assert
      expect(element.classList.contains('test-class')).toBe(true);
    });

    it('should handle null element', () => {
      // Act & Assert - should not throw
      expect(() => addClass(null, 'test-class')).not.toThrow();
    });

    it('should not duplicate existing class', () => {
      // Arrange
      const element = document.createElement('div');
      element.className = 'test-class';

      // Act
      addClass(element, 'test-class');

      // Assert
      expect(element.className).toBe('test-class');
    });
  });

  describe('removeClass', () => {
    it('should remove class from element', () => {
      // Arrange
      const element = document.createElement('div');
      element.className = 'test-class other-class';

      // Act
      removeClass(element, 'test-class');

      // Assert
      expect(element.classList.contains('test-class')).toBe(false);
      expect(element.classList.contains('other-class')).toBe(true);
    });

    it('should handle null element', () => {
      // Act & Assert - should not throw
      expect(() => removeClass(null, 'test-class')).not.toThrow();
    });

    it('should handle non-existent class', () => {
      // Arrange
      const element = document.createElement('div');

      // Act & Assert - should not throw
      expect(() => removeClass(element, 'not-there')).not.toThrow();
    });
  });

  describe('toggleClass', () => {
    it('should toggle class on element', () => {
      // Arrange
      const element = document.createElement('div');

      // Act - add
      toggleClass(element, 'test-class');
      expect(element.classList.contains('test-class')).toBe(true);

      // Act - remove
      toggleClass(element, 'test-class');
      expect(element.classList.contains('test-class')).toBe(false);
    });

    it('should force add class', () => {
      // Arrange
      const element = document.createElement('div');

      // Act
      toggleClass(element, 'test-class', true);
      toggleClass(element, 'test-class', true);

      // Assert
      expect(element.classList.contains('test-class')).toBe(true);
    });

    it('should force remove class', () => {
      // Arrange
      const element = document.createElement('div');
      element.className = 'test-class';

      // Act
      toggleClass(element, 'test-class', false);

      // Assert
      expect(element.classList.contains('test-class')).toBe(false);
    });

    it('should handle null element', () => {
      // Act & Assert - should not throw
      expect(() => toggleClass(null, 'test-class')).not.toThrow();
    });
  });

  describe('isInDOM', () => {
    it('should return true for element in DOM', () => {
      // Arrange
      const element = document.createElement('div');
      document.body.appendChild(element);

      // Act & Assert
      expect(isInDOM(element)).toBe(true);
    });

    it('should return false for element not in DOM', () => {
      // Arrange
      const element = document.createElement('div');

      // Act & Assert
      expect(isInDOM(element)).toBe(false);
    });

    it('should return false for null', () => {
      // Act & Assert
      expect(isInDOM(null)).toBe(false);
    });

    it('should return true for nested element', () => {
      // Arrange
      const parent = document.createElement('div');
      const child = document.createElement('span');
      parent.appendChild(child);
      document.body.appendChild(parent);

      // Act & Assert
      expect(isInDOM(child)).toBe(true);
    });
  });

  describe('createTextNode', () => {
    it('should create text node with content', () => {
      // Act
      const textNode = createTextNode('Hello World');

      // Assert
      expect(textNode.nodeType).toBe(Node.TEXT_NODE);
      expect(textNode.textContent).toBe('Hello World');
    });

    it('should handle empty string', () => {
      // Act
      const textNode = createTextNode('');

      // Assert
      expect(textNode.textContent).toBe('');
    });
  });

  describe('setAttributes', () => {
    it('should set multiple attributes', () => {
      // Arrange
      const element = document.createElement('input');

      // Act
      setAttributes(element, {
        type: 'email',
        placeholder: 'Enter email',
        required: 'true',
        'data-testid': 'email-input',
      });

      // Assert
      expect(element.getAttribute('type')).toBe('email');
      expect(element.getAttribute('placeholder')).toBe('Enter email');
      expect(element.getAttribute('required')).toBe('true');
      expect(element.getAttribute('data-testid')).toBe('email-input');
    });

    it('should handle empty attributes object', () => {
      // Arrange
      const element = document.createElement('div');

      // Act & Assert - should not throw
      expect(() => setAttributes(element, {})).not.toThrow();
    });
  });

  describe('focusElement', () => {
    it('should focus element', () => {
      // Arrange
      const button = document.createElement('button');
      document.body.appendChild(button);

      // Act
      focusElement(button);

      // Assert
      expect(document.activeElement).toBe(button);
    });

    it('should handle null element', () => {
      // Act & Assert - should not throw
      expect(() => focusElement(null)).not.toThrow();
    });

    it('should add temporary tabindex when needed', () => {
      // Arrange
      const div = document.createElement('div');
      document.body.appendChild(div);
      expect(div.hasAttribute('tabindex')).toBe(false);

      // Act
      focusElement(div, true);

      // Assert
      expect(document.activeElement).toBe(div);
      expect(div.hasAttribute('tabindex')).toBe(false);
    });

    it('should not add temporary tabindex if already present', () => {
      // Arrange
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      document.body.appendChild(div);

      // Act
      focusElement(div, true);

      // Assert
      expect(document.activeElement).toBe(div);
      expect(div.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('appendChildren', () => {
    it('should append multiple elements', () => {
      // Arrange
      const parent = document.createElement('div');
      const child1 = document.createElement('span');
      const child2 = document.createElement('button');
      const child3 = createTextNode('Text');

      // Act
      appendChildren(parent, child1, child2, child3);

      // Assert
      expect(parent.children.length).toBe(2);
      expect(parent.childNodes.length).toBe(3);
      expect(parent.childNodes[0]).toBe(child1);
      expect(parent.childNodes[1]).toBe(child2);
      expect(parent.childNodes[2]).toBe(child3);
    });

    it('should handle empty children', () => {
      // Arrange
      const parent = document.createElement('div');

      // Act
      appendChildren(parent);

      // Assert
      expect(parent.children.length).toBe(0);
    });

    it('should append in order', () => {
      // Arrange
      const parent = document.createElement('ul');
      const items = Array.from({ length: 5 }, (_, i) => {
        const li = document.createElement('li');
        li.textContent = `Item ${i}`;
        return li;
      });

      // Act
      appendChildren(parent, ...items);

      // Assert
      expect(parent.children.length).toBe(5);
      Array.from(parent.children).forEach((child, i) => {
        expect(child.textContent).toBe(`Item ${i}`);
      });
    });
  });
});
