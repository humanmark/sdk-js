// Only export what SDK consumers need
export { HumanmarkVerificationCancelledError } from './VerificationCancelledError';
export { HumanmarkError, ErrorCodes, isHumanmarkError } from './HumanmarkError';

// Internal error classes are not exported - consumers use error.code instead
