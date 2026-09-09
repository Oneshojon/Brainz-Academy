import axios from 'axios';

/**
 * Generic API-client factory. Originally written for schools/ui's
 * api/client.js, then generalized and extracted here during the
 * school-portal build so frontend/ui and schools/ui share this one
 * implementation instead of each keeping a drifting copy — any feature
 * added to either app going forward should build on this rather than
 * re-deriving CSRF/error handling again.
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
 * Maps an axios error into an ApiError with a user-facing message.
 * Exported separately so it's unit-testable without mocking a full
 * request cycle.
 *
 * `overrides` lets a host app substitute its own wording for the two
 * generic fallback cases (403 with no server detail, 502/503) without
 * forking this function. This exists because the defaults below were
 * written for an AI-feature context (frontend/ui's Lesson Plan Generator)
 * -- schools/ui's registration flow talks to Paystack, not an AI
 * service, so "The AI service is temporarily unavailable" would be
 * actively wrong there. See schools/ui/src/api/schoolsApi.js's
 * SCHOOLS_ERROR_MESSAGES for the concrete override.
 *
 * @param {import('axios').AxiosError} error
 * @param {{forbidden?: string, serviceUnavailable?: string}} [overrides]
 */
export function normalizeError(error, overrides = {}) {
  if (!error.response) {
    return new ApiError('Could not reach the server. Check your connection and try again.', {
      status: 0,
    });
  }

  const { status, data } = error.response;

  // Admin kill switch / feature not available — { "error": "..." }, e.g.
  // ai_lesson_plans FeatureFlag off (see lesson_plans/views.py)
  if (status === 404 && data?.error) {
    return new ApiError(data.error, { status });
  }

  // DRF validation error — { field: ["message"] } shape
  if (status === 400 && data && typeof data === 'object') {
    return new ApiError('Please fix the highlighted fields.', { status, fieldErrors: data });
  }

  if (status === 403) {
    return new ApiError(
      data?.detail ?? data?.error ?? overrides.forbidden ?? "You don't have access to this feature yet.",
      { status },
    );
  }

  if (status === 503) {
    return new ApiError(
      data?.error ?? overrides.serviceUnavailable ?? 'The AI service is temporarily unavailable. Please try again shortly.',
      { status },
    );
  }

  if (status === 502) {
    return new ApiError(
      overrides.serviceUnavailable ?? 'The service is temporarily unavailable. Please try again shortly.',
      { status },
    );
  }

  return new ApiError(data?.detail ?? data?.error ?? 'Something went wrong. Please try again.', { status });
}

/**
 * Creates an axios instance scoped to `baseURL`, with CSRF + error
 * normalization wired up identically every time.
 * @param {string} baseURL - e.g. '/api/lesson-plans/'
 * @param {{messages?: {forbidden?: string, serviceUnavailable?: string}}} [options]
 */
export function createApiClient(baseURL, { messages } = {}) {
  const client = axios.create({ baseURL, withCredentials: true });

  client.interceptors.request.use((config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) config.headers['X-CSRFToken'] = csrfToken;
    return config;
  });

  client.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(normalizeError(error, messages)),
  );

  return client;
}