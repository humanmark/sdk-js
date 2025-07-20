/**
 * Type-safe DOM utilities for the Humanmark SDK
 * Provides safer alternatives to querySelector with proper typing
 */

import { NAMESPACES } from '@/constants/ui';

/**
 * Type-safe querySelector that returns null instead of null | Element
 * @param parent - Parent element to query within
 * @param selector - CSS selector
 * @returns The element or null
 */
export function querySelector<T extends HTMLElement>(
  parent: Element | Document,
  selector: string
): T | null {
  return parent.querySelector(selector);
}

/**
 * Type-safe querySelector that throws if element not found
 * @param parent - Parent element to query within
 * @param selector - CSS selector
 * @param errorMessage - Optional custom error message
 * @returns The element
 * @throws Error if element not found
 */
export function querySelectorOrThrow<T extends HTMLElement>(
  parent: Element | Document,
  selector: string,
  errorMessage?: string
): T {
  const element = parent.querySelector(selector);
  if (!element) {
    throw new Error(errorMessage ?? `Element not found: ${selector}`);
  }
  return element as T;
}

/**
 * Safely removes all children from an element
 * @param parent - Parent element to clear
 */
export function removeAllChildren(parent: HTMLElement): void {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

/**
 * Creates an element with optional className and attributes
 * @param tagName - HTML tag name
 * @param options - Optional className and attributes
 * @returns The created element
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: {
    className?: string;
    attributes?: Record<string, string>;
    textContent?: string;
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options?.className) {
    element.className = options.className;
  }

  if (options?.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options?.textContent) {
    element.textContent = options.textContent;
  }

  return element;
}

/**
 * Creates an SVG element with proper namespace
 * @param tagName - SVG element tag name
 * @param attributes - Optional attributes
 * @returns The created SVG element
 */
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string>
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(NAMESPACES.SVG, tagName);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  return element;
}

/**
 * Safely adds a class to an element
 * @param element - Element to add class to
 * @param className - Class name to add
 */
export function addClass(element: Element | null, className: string): void {
  element?.classList.add(className);
}

/**
 * Safely removes a class from an element
 * @param element - Element to remove class from
 * @param className - Class name to remove
 */
export function removeClass(element: Element | null, className: string): void {
  element?.classList.remove(className);
}

/**
 * Safely toggles a class on an element
 * @param element - Element to toggle class on
 * @param className - Class name to toggle
 * @param force - Optional force add/remove
 */
export function toggleClass(
  element: Element | null,
  className: string,
  force?: boolean
): void {
  element?.classList.toggle(className, force);
}

/**
 * Checks if an element is in the DOM
 * @param element - Element to check
 * @returns true if element is in the DOM
 */
export function isInDOM(element: Element | null): boolean {
  return element ? document.body.contains(element) : false;
}

/**
 * Creates a text node with safe content
 * @param text - Text content
 * @returns Text node
 */
export function createTextNode(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Sets multiple attributes on an element
 * @param element - Element to set attributes on
 * @param attributes - Attributes to set
 */
export function setAttributes(
  element: Element,
  attributes: Record<string, string>
): void {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

/**
 * Focuses an element with optional temporary tabindex
 * @param element - Element to focus
 * @param temporary - Whether to add temporary tabindex
 */
export function focusElement(
  element: HTMLElement | null,
  temporary = false
): void {
  if (!element) return;

  if (temporary && !element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');
    element.focus();
    element.removeAttribute('tabindex');
  } else {
    element.focus();
  }
}

/**
 * Appends multiple children to a parent element
 * @param parent - Parent element
 * @param children - Children to append
 */
export function appendChildren(
  parent: Element,
  ...children: (Element | Text)[]
): void {
  children.forEach(child => parent.appendChild(child));
}
