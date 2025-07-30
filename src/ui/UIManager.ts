import { QRCodeGenerator } from './QRCodeGenerator';
import { DeepLinkHandler } from './DeepLinkHandler';
import { shouldShowQRCode } from '@/utils/device';
import { AccessibilityManager } from './AccessibilityManager';
import type { IUIManager, ModalOptions, VerificationUIState } from '@/types/ui';
import {
  CSS_CLASSES,
  MESSAGES,
  ANIMATION_TIMINGS,
  ELEMENT_IDS,
  KEYBOARD_KEYS,
  COLORS,
} from '@/constants/ui';
import {
  querySelector,
  removeAllChildren,
  addClass,
  removeClass,
  isInDOM,
  focusElement,
  createElement,
} from '@/utils/dom';
import {
  createProgressBar,
  createBrandedTitle,
  createSubtitle,
  createSuccessContent,
  createQRCodeContainer,
  createMobileContainer,
  createModalBody,
  createScreenReaderAnnouncement,
  createWhatIsThisLink,
} from './templates';
import { createCloseButtonSVG } from './SVGBuilder';
import { getTokenExpiration } from '@/utils/challengeToken';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollbar';
import '@/styles/humanmark.css';

export class UIManager implements IUIManager {
  private modal: HTMLDivElement | null = null;
  private focusTrapCleanup: (() => void) | null = null;
  private modalClosedCallback: (() => void) | null = null;
  private successCallback: (() => void) | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private tokenExpiration: number = 0;
  private _currentState: VerificationUIState = 'initializing';

  private get currentState(): VerificationUIState {
    return this._currentState;
  }

  private set currentState(state: VerificationUIState) {
    this._currentState = state;
  }
  private modalOptions: ModalOptions = {};
  private static readonly MODAL_ID = ELEMENT_IDS.MODAL;
  private static readonly TITLE_ID = ELEMENT_IDS.TITLE;
  private static readonly DESC_ID = ELEMENT_IDS.DESCRIPTION;

  onModalClosed(callback: () => void): void {
    this.modalClosedCallback = callback;
  }

  onSuccess(callback: () => void): void {
    this.successCallback = callback;
  }

  showSuccess(): void {
    if (!this.modal) return;

    // Update state
    this.setState('completed');

    const modalContent = querySelector<HTMLDivElement>(
      this.modal,
      `.${CSS_CLASSES.MODAL.CONTENT}`
    );
    if (!modalContent) return;

    // Find the modal body (everything except close button and progress bar)
    const modalBody = querySelector<HTMLDivElement>(
      modalContent,
      `.${CSS_CLASSES.MODAL.BODY}`
    );
    if (!modalBody) return;

    // Fade out current content
    addClass(modalBody, CSS_CLASSES.ANIMATIONS.FADE_OUT);

    setTimeout(() => {
      // Clear current content safely
      removeAllChildren(modalBody);

      // Create success content using template
      const successContainer = createSuccessContent();
      modalBody.appendChild(successContainer);

      // Remove fade out class and show success
      removeClass(modalBody, CSS_CLASSES.ANIMATIONS.FADE_OUT);
      requestAnimationFrame(() => {
        addClass(successContainer, CSS_CLASSES.SUCCESS.VISIBLE);
      });

      // Announce success
      AccessibilityManager.announce(
        MESSAGES.ACCESSIBILITY.VERIFICATION_SUCCESS,
        'assertive'
      );

      // Hide progress bar during success
      const progressContainer = querySelector<HTMLElement>(
        modalContent,
        `.${CSS_CLASSES.PROGRESS.CONTAINER}`
      );
      if (progressContainer) {
        addClass(progressContainer, CSS_CLASSES.PROGRESS.HIDDEN);
      }

      // Call success callback after animation completes
      setTimeout(() => {
        if (this.successCallback) {
          this.successCallback();
          this.successCallback = null;
        }
      }, ANIMATION_TIMINGS.SUCCESS_DISPLAY);
    }, ANIMATION_TIMINGS.FADE_OUT);
  }

  showModal(options?: ModalOptions): Promise<void> {
    this.modalOptions = options ?? {};
    this.setState('initializing');
    return Promise.resolve();
  }

  updateContent(content: string): void {
    if (!this.modal) return;

    const modalBody = querySelector<HTMLDivElement>(
      this.modal,
      `.${CSS_CLASSES.MODAL.BODY}`
    );
    if (modalBody) {
      // Clear existing content
      while (modalBody.firstChild) {
        modalBody.removeChild(modalBody.firstChild);
      }
      // Create a text node or parse safe content
      const contentWrapper = createElement('div');
      contentWrapper.textContent = content;
      modalBody.appendChild(contentWrapper);
    }
  }

  setState(state: VerificationUIState): void {
    // Prevent concurrent state changes
    const previousState = this.currentState;

    // Validate state transitions to prevent invalid states
    if (!this.isValidStateTransition(previousState, state)) {
      return;
    }

    this.currentState = state;

    // Emit state change event
    const event = new CustomEvent('stateChanged', {
      detail: { state, previousState },
    });
    this.modal?.dispatchEvent(event);
  }

  private isValidStateTransition(
    from: VerificationUIState,
    to: VerificationUIState
  ): boolean {
    // Define valid state transitions
    const validTransitions: Record<VerificationUIState, VerificationUIState[]> =
      {
        initializing: [
          'showing-qr',
          'waiting-for-verification',
          'cancelled',
          'error',
        ],
        'showing-qr': ['waiting-for-verification', 'cancelled', 'error'],
        'waiting-for-verification': ['completed', 'cancelled', 'error'],
        completed: [], // Terminal state
        cancelled: [], // Terminal state
        error: [], // Terminal state
      };

    return validTransitions[from]?.includes(to) ?? false;
  }

  cleanup(): void {
    this.hideModal(true);
    this.modalClosedCallback = null;
    this.successCallback = null;
    this.stopProgressAnimation();

    // Clean up accessibility announcement element
    AccessibilityManager.cleanup();
  }

  async showVerificationModal(
    token: string,
    options?: ModalOptions
  ): Promise<void> {
    // Prevent showing multiple modals
    if (this.modal && this.currentState !== 'cancelled') {
      return;
    }

    // Store options
    this.modalOptions = options ?? {};

    // Remove any existing modal first
    this.hideModal(true);

    // Reset state for new verification
    this._currentState = 'initializing';

    // Parse token to get expiration time
    try {
      this.tokenExpiration = getTokenExpiration(token);
    } catch {
      // If we can't parse the token, use a default 2 minutes from now
      this.tokenExpiration = Date.now() + 120000;
    }

    // Create modal container
    this.modal = this.createModal();

    // Add content based on device type
    if (shouldShowQRCode()) {
      this.setState('showing-qr');
      await this.addQRCodeContent(this.modal, token);
    } else {
      this.addMobileContent(this.modal, token);
    }

    // Update to waiting state
    this.setState('waiting-for-verification');

    // Add modal to page
    document.body.appendChild(this.modal);

    // Lock body scroll with layout shift prevention
    lockBodyScroll();

    // Set up accessibility
    AccessibilityManager.setupModalAria(
      this.modal,
      UIManager.TITLE_ID,
      UIManager.DESC_ID
    );

    // Create focus trap
    this.focusTrapCleanup = AccessibilityManager.createFocusTrap(this.modal);

    // Start progress bar animation
    this.startProgressAnimation();

    // Focus on appropriate element based on device type
    requestAnimationFrame(() => {
      if (!this.modal) return;

      if (shouldShowQRCode()) {
        // Desktop: Focus on the title
        const title = querySelector<HTMLElement>(
          this.modal,
          `#${UIManager.TITLE_ID}`
        );
        focusElement(title, true);
      } else {
        // Mobile: Focus on the verify button
        const verifyButton = querySelector<HTMLElement>(
          this.modal,
          `.${CSS_CLASSES.BUTTONS.VERIFY}`
        );
        focusElement(verifyButton);
      }
    });

    // Announce to screen readers
    AccessibilityManager.announce(
      MESSAGES.ACCESSIBILITY.MODAL_OPENED,
      'assertive'
    );

    // Add ESC key listener
    this.addKeyboardListeners();
  }

  hideModal(immediate = false): void {
    const wasVisible = !!this.modal;

    // Stop progress animation immediately to prevent it running after modal removal
    this.stopProgressAnimation();

    if (this.modal) {
      if (immediate) {
        this.cleanupModal();
      } else {
        // Add closing animation
        addClass(this.modal, CSS_CLASSES.MODAL.CLOSING);

        // Wait for animation to complete
        setTimeout(() => {
          this.cleanupModal();
        }, ANIMATION_TIMINGS.MODAL_CLOSE);
      }
    } else {
      // Remove any existing modal
      const existingModal = document.getElementById(UIManager.MODAL_ID);
      if (existingModal && document.body.contains(existingModal)) {
        document.body.removeChild(existingModal);
      }
    }

    // Notify that modal was closed (only if it was actually visible)
    if (wasVisible && this.modalClosedCallback) {
      this.modalClosedCallback();
      this.modalClosedCallback = null;
    }
  }

  private cleanupModal(): void {
    // Stop progress animation
    this.stopProgressAnimation();

    if (this.modal?.parentNode) {
      // Remove all event listeners
      const modalContent = querySelector<HTMLElement>(
        this.modal,
        `.${CSS_CLASSES.MODAL.CONTENT}`
      );
      if (modalContent) {
        modalContent.removeEventListener('click', this.stopPropagation);

        // Remove close button listener
        const closeButton = querySelector<HTMLButtonElement>(
          modalContent,
          `.${CSS_CLASSES.BUTTONS.CLOSE}`
        );
        if (closeButton) {
          closeButton.removeEventListener('click', this.closeButtonHandler);
        }
      }

      // Remove backdrop click listener
      this.modal.removeEventListener('click', this.backdropClickHandler);

      // Only remove if still in DOM
      if (isInDOM(this.modal)) {
        document.body.removeChild(this.modal);
      }
      this.modal = null;
    }

    // Unlock body scroll and restore original state
    unlockBodyScroll();

    // Clean up focus trap
    if (this.focusTrapCleanup) {
      this.focusTrapCleanup();
      this.focusTrapCleanup = null;
    }

    // Announce closure
    AccessibilityManager.announce(
      MESSAGES.ACCESSIBILITY.MODAL_CLOSED,
      'polite'
    );

    this.removeKeyboardListeners();
  }

  private closeButtonHandler = (): void => {
    this.setState('cancelled');
    this.hideModal();
  };

  private backdropClickHandler = (e: Event): void => {
    if (e.target === this.modal) {
      this.setState('cancelled');
      this.hideModal();
    }
  };

  private createModal(): HTMLDivElement {
    // Apply custom z-index if provided
    const zIndex = this.modalOptions.zIndex?.toString() ?? '';

    const modal = createElement('div', {
      className: CSS_CLASSES.MODAL.OVERLAY,
      attributes: {
        id: UIManager.MODAL_ID,
        ...(zIndex && { style: `z-index: ${zIndex}` }),
      },
    });

    const modalContent = createElement('div', {
      className: CSS_CLASSES.MODAL.CONTENT,
    });

    // Add close button directly to modal content
    const closeButton = createElement('button', {
      className: CSS_CLASSES.BUTTONS.CLOSE,
      attributes: {
        'aria-label': MESSAGES.ACCESSIBILITY.CLOSE_BUTTON_LABEL,
        type: 'button',
      },
    });

    // Add SVG icon to close button
    const closeIcon = createCloseButtonSVG();
    closeButton.appendChild(closeIcon);

    closeButton.addEventListener('click', this.closeButtonHandler);
    modalContent.appendChild(closeButton);

    // Add progress bar
    const progressContainer = createProgressBar();
    modalContent.appendChild(progressContainer);

    // Set initial max value based on token expiration
    const progressBar = querySelector<HTMLElement>(
      progressContainer,
      `.${CSS_CLASSES.PROGRESS.BAR}`
    );
    if (progressBar && this.tokenExpiration) {
      const totalSeconds = Math.ceil(
        (this.tokenExpiration - Date.now()) / 1000
      );
      progressBar.setAttribute('aria-valuemax', totalSeconds.toString());
      progressBar.setAttribute('aria-valuenow', totalSeconds.toString());
    }

    modal.appendChild(modalContent);

    // Prevent event propagation from modal content
    modalContent.addEventListener('click', this.stopPropagation);

    // Close modal when clicking backdrop (if enabled)
    if (this.modalOptions.closeOnBackdropClick !== false) {
      modal.addEventListener('click', this.backdropClickHandler);
    }

    return modal;
  }

  private async addQRCodeContent(
    modal: HTMLDivElement,
    token: string
  ): Promise<void> {
    const content = querySelector<HTMLDivElement>(
      modal,
      `.${CSS_CLASSES.MODAL.CONTENT}`
    );
    if (!content) return;

    // Create modal body wrapper
    const modalBody = createModalBody();

    // Add title
    const title = createBrandedTitle();
    modalBody.appendChild(title);

    // Add subtitle
    const subtitle = createSubtitle(MESSAGES.VERIFICATION.DESKTOP_SUBTITLE);
    modalBody.appendChild(subtitle);

    // Create QR code container
    const qrCodeContainer = createQRCodeContainer();
    const qrWrapper = querySelector<HTMLDivElement>(
      qrCodeContainer,
      `.${CSS_CLASSES.QR_CODE.WRAPPER}`
    );

    if (qrWrapper) {
      try {
        const qrCodeImg = await QRCodeGenerator.generateQRCodeElement(token, {
          color: {
            dark: COLORS.QR_CODE.PRIMARY,
            light: COLORS.QR_CODE.LIGHT,
          },
        });
        qrWrapper.appendChild(qrCodeImg);
      } catch {
        const errorMsg = createElement('p', {
          className: 'humanmark-error',
          textContent: MESSAGES.ERRORS.QR_GENERATION_FAILED,
        });
        qrWrapper.appendChild(errorMsg);
      }
    }

    // Add time remaining notice for screen readers
    const timeNotice = createScreenReaderAnnouncement(
      MESSAGES.ACCESSIBILITY.TIME_NOTICE
    );
    qrCodeContainer.appendChild(timeNotice);

    modalBody.appendChild(qrCodeContainer);

    // Add "What is this?" link
    const whatIsThisLink = createWhatIsThisLink();
    modalBody.appendChild(whatIsThisLink);

    content.appendChild(modalBody);
  }

  private addMobileContent(modal: HTMLDivElement, token: string): void {
    const content = querySelector<HTMLDivElement>(
      modal,
      `.${CSS_CLASSES.MODAL.CONTENT}`
    );
    if (!content) return;

    // Create modal body wrapper
    const modalBody = createModalBody();

    // Add title
    const title = createBrandedTitle();
    modalBody.appendChild(title);

    // Add subtitle
    const subtitle = createSubtitle(MESSAGES.VERIFICATION.MOBILE_SUBTITLE);
    modalBody.appendChild(subtitle);

    // Create mobile container
    const mobileContainer = createMobileContainer();

    // Add verify button
    const verifyButton = DeepLinkHandler.createVerifyButton(token);
    addClass(verifyButton, CSS_CLASSES.BUTTONS.VERIFY);

    mobileContainer.appendChild(verifyButton);
    modalBody.appendChild(mobileContainer);

    // Add "What is this?" link
    const whatIsThisLink = createWhatIsThisLink();
    modalBody.appendChild(whatIsThisLink);

    content.appendChild(modalBody);
  }

  private addKeyboardListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private removeKeyboardListeners(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (
      event.key === KEYBOARD_KEYS.ESCAPE &&
      this.modalOptions.closeOnEsc !== false
    ) {
      this.setState('cancelled');
      this.hideModal();
    }
  };

  private stopPropagation = (event: Event): void => {
    event.stopPropagation();
  };

  private startProgressAnimation(): void {
    if (!this.modal) return;

    const progressBar = querySelector<HTMLElement>(
      this.modal,
      `.${CSS_CLASSES.PROGRESS.BAR}`
    );

    if (!progressBar) return;

    // Clear any existing interval
    this.stopProgressAnimation();

    // Calculate total duration
    const totalDuration = this.tokenExpiration - Date.now();
    const startTime = Date.now();

    // Update progress immediately
    this.updateProgress(progressBar, startTime, totalDuration);

    // Update progress every 100ms for smooth animation
    this.progressInterval = setInterval(() => {
      this.updateProgress(progressBar, startTime, totalDuration);
    }, 100);
  }

  private stopProgressAnimation(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private updateProgress(
    progressBar: HTMLElement,
    startTime: number,
    totalDuration: number
  ): void {
    // Check if modal still exists before updating
    if (!this.modal || !isInDOM(this.modal)) {
      this.stopProgressAnimation();
      return;
    }

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalDuration - elapsed);
    const progress = Math.max(
      0,
      Math.min(100, (elapsed / totalDuration) * 100)
    );

    // Check if progress bar still exists
    if (!isInDOM(progressBar)) {
      this.stopProgressAnimation();
      return;
    }

    // Update progress bar width - start at 100% and go to 0%
    progressBar.style.width = `${100 - progress}%`;

    // Update ARIA attributes
    const remainingSeconds = Math.ceil(remaining / 1000);
    progressBar.setAttribute('aria-valuenow', remainingSeconds.toString());
    progressBar.setAttribute(
      'aria-label',
      `${remainingSeconds} seconds remaining for verification`
    );

    // If time has expired, stop the animation
    if (remaining <= 0) {
      this.stopProgressAnimation();
    }
  }
}
