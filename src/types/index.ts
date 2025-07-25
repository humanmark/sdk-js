/**
 * Central export point for all SDK types
 */

// Core types
export * from './api';
export * from './config';
export * from './challenge';
export * from './errors';
export * from './ui';

// Re-export commonly used types at the top level
export type { HumanmarkConfig } from './config';

export type { WaitResponse } from './api';

export type { ChallengeMetadata, ChallengeStatus } from './challenge';

export type { VerificationUIState } from './ui';

export type { ErrorCode } from './errors';
