import axios from 'axios';

/**
 * axios instance for the School Plan API, matching the existing
 * catalog api.js pattern: session-cookie auth (`withCredentials`) plus
 * Django's CSRF token attached from the `csrftoken` cookie on every
 * request — required for POST/PATCH/DELETE under SessionAuthentication.
 */

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

/**
 * Normalized error thrown for any non-2xx response.
 * @property {number} status
 * @property {Object|null} fieldErrors - DRF {field: [messages]} shape, 400s only.
 */
export class ApiError extends Error {
  constructor(message, { status, fieldErrors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Maps an axios error into an ApiError with a user-facing message,
 * per the error contract in the frontend handoff doc. Exported
 * separately so it's unit-testable without mocking a full request cycle.
 * @param {import('axios').AxiosError} error
 */
export function normalizeError(error) {
  if (!error.response) {
    return new ApiError('Could not reach the server. Check your connection and try again.', {
      status: 0,
    });
  }

  const { status, data } = error.response;

  // Feature flag off — { "error": "School Plan is not currently available." }
  if (status === 404 && data?.error) {
    return new ApiError(data.error, { status });
  }

  // DRF validation error — { field: ["message"] } shape
  if (status === 400 && data && typeof data === 'object') {
    return new ApiError('Please fix the highlighted fields.', { status, fieldErrors: data });
  }

  if (status === 403) {
    return new ApiError(
      data?.detail ?? 'You need to be signed in with the right access for this.',
      { status },
    );
  }

  if (status === 502 || status === 503) {
    return new ApiError(
      'The payment provider is temporarily unavailable. Please try again shortly.',
      { status },
    );
  }

  return new ApiError(data?.detail ?? 'Something went wrong. Please try again.', { status });
}

const schoolsApiClient = axios.create({
  baseURL: '/schools/',
  withCredentials: true,
});

schoolsApiClient.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) config.headers['X-CSRFToken'] = csrfToken;
  return config;
});

schoolsApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(normalizeError(error)),
);

export default schoolsApiClient;