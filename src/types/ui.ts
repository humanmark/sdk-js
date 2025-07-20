/**
 * UI-related types for the Humanmark SDK
 */

/**
 * Modal configuration options
 */
export interface ModalOptions {
  /**
   * Z-index for the modal overlay
   * @default 999999
   */
  zIndex?: number;

  /**
   * Whether the modal can be closed by clicking the backdrop
   * @default true
   */
  closeOnBackdropClick?: boolean;

  /**
   * Whether the modal can be closed by pressing ESC
   * @default true
   */
  closeOnEsc?: boolean;

  /**
   * Custom CSS class to apply to the modal container
   */
  className?: string;

  /**
   * ARIA label for the modal
   * @default 'Humanmark verification'
   */
  ariaLabel?: string;
}

/**
 * UI state during verification
 */
export type VerificationUIState =
  | 'initializing'
  | 'showing-qr'
  | 'waiting-for-verification'
  | 'completed'
  | 'error'
  | 'cancelled';

/**
 * UI Manager interface
 */
export interface IUIManager {
  /**
   * Show the verification modal
   */
  showModal(options?: ModalOptions): Promise<void>;

  /**
   * Hide the verification modal
   */
  hideModal(): void;

  /**
   * Update the modal content
   */
  updateContent(content: string): void;

  /**
   * Set the current UI state
   */
  setState(state: VerificationUIState): void;

  /**
   * Clean up UI resources
   */
  cleanup(): void;
}
