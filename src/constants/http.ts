/**
 * HTTP status code constants
 * Standard HTTP status codes used throughout the SDK
 */

export const HTTP_STATUS = {
  /** The server cannot or will not process the request due to an apparent client error */
  BAD_REQUEST: 400,
  /** Invalid or missing API key */
  UNAUTHORIZED: 401,
  /** API key does not have access to this resource */
  FORBIDDEN: 403,
  /** Server timeout waiting for the request */
  REQUEST_TIMEOUT: 408,
  /** The requested content has been permanently deleted */
  GONE: 410,
  /** User has sent too many requests in a given amount of time */
  TOO_MANY_REQUESTS: 429,
  /** Server has encountered a situation it doesn't know how to handle */
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * HTTP method constants
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
} as const;

/**
 * Common HTTP headers
 */
export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  API_KEY: 'hm-api-key',
} as const;

/**
 * Content type values
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
} as const;
