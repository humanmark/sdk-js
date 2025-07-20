import { HumanmarkError } from './HumanmarkError';
import { ErrorCode } from '@/types/errors';

/**
 * Error thrown when user cancels verification by closing the modal
 */
export class HumanmarkVerificationCancelledError extends HumanmarkError {
  constructor(message: string = 'User cancelled verification') {
    super(message, ErrorCode.USER_CANCELLED);
    this.name = 'HumanmarkVerificationCancelledError';
  }
}
