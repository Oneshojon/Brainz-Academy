import axios from 'axios';

/**
 * Generic API-client factory, adapted from schools/ui's proven pattern
 * (schools/ui/src/api/client.js). frontend/ui and schools/ui are separate
 * Vite apps with no workspace link, so this is a duplicated-on-purpose
 * copy of that design, not a cross-app import — any feature added to
 * frontend/ui going forward should build on this rather than re-deriving
 * CSRF/error handling again.
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
 * @param {import('axios').AxiosError} error
 */
export function normalizeError(error) {
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
      data?.detail ?? data?.error ?? "You don't have access to this feature yet.",
      { status },
    );
  }

  if (status === 503) {
    return new ApiError(
      data?.error ?? 'The AI service is temporarily unavailable. Please try again shortly.',
      { status },
    );
  }

  if (status === 502) {
    return new ApiError('The service is temporarily unavailable. Please try again shortly.', { status });
  }

  return new ApiError(data?.detail ?? data?.error ?? 'Something went wrong. Please try again.', { status });
}

/**
 * Creates an axios instance scoped to `baseURL`, with CSRF + error
 * normalization wired up identically every time.
 * @param {string} baseURL - e.g. '/api/lesson-plans/'
 */
export function createApiClient(baseURL) {
  const client = axios.create({ baseURL, withCredentials: true });

  client.interceptors.request.use((config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) config.headers['X-CSRFToken'] = csrfToken;
    return config;
  });

  client.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(normalizeError(error)),
  );

  return client;
}