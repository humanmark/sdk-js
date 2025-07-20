export const ENDPOINTS = {
  CREATE_CHALLENGE: '/api/v1/challenge/create',
  WAIT_CHALLENGE: '/api/v1/challenge/wait',
} as const;

export const DEFAULT_BASE_URL = 'https://humanmark.io';
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
