import { createApiClient } from '@brainz/shared-ui';

/**
 * School Plan API surface — one function per endpoint from the frontend
 * handoff doc. Admin-management functions are included now so the full
 * contract lives in one file, even though only the public + registration
 * flow is wired to UI this pass.
 */

// Preserves the exact wording this app had before migrating onto the
// shared client factory -- @brainz/shared-ui's own defaults were written
// for an AI-feature context (frontend/ui's Lesson Plan Generator) and
// would say things like "The AI service is temporarily unavailable",
// which is wrong here: schools/ui's 502/503 case is Paystack, not AI.
// Exported so schoolsApi.test.js can assert on it directly rather than
// duplicating these strings in the test.
export const SCHOOLS_ERROR_MESSAGES = {
  forbidden: 'You need to be signed in with the right access for this.',
  serviceUnavailable: 'The payment provider is temporarily unavailable. Please try again shortly.',
};

const schoolsApiClient = createApiClient('/schools/', { messages: SCHOOLS_ERROR_MESSAGES });

/** GET /schools/plans/ — public plan list for the pricing page. */
export function listPlans(signal) {
  return schoolsApiClient.get('plans/', { signal });
}

/**
 * POST /schools/register/
 * @param {{name: string, state: string, contact_email: string, plan_id: number}} payload
 * @returns {Promise<{authorization_url: string, school_id: number}>}
 */
export function registerSchool(payload) {
  return schoolsApiClient.post('register/', payload);
}

// --- Admin-management (wired to UI in the next pass) ---

export function listTerms(signal) {
  return schoolsApiClient.get('terms/', { signal });
}
export function createTerm(payload) {
  return schoolsApiClient.post('terms/', payload);
}
export function updateTerm(id, payload) {
  return schoolsApiClient.patch(`terms/${id}/`, payload);
}
export function deleteTerm(id) {
  return schoolsApiClient.delete(`terms/${id}/`);
}

export function listCohorts(signal) {
  return schoolsApiClient.get('cohorts/', { signal });
}
export function createCohort(payload) {
  return schoolsApiClient.post('cohorts/', payload);
}
export function updateCohort(id, payload) {
  return schoolsApiClient.patch(`cohorts/${id}/`, payload);
}
export function deleteCohort(id) {
  return schoolsApiClient.delete(`cohorts/${id}/`);
}

export function listStaff(signal) {
  return schoolsApiClient.get('staff/', { signal });
}

export function createInvite(payload) {
  return schoolsApiClient.post('invites/', payload);
}
export function redeemInvite(token) {
  return schoolsApiClient.post('invites/redeem/', { token });
}

export function listClassGroups(signal) {
  return schoolsApiClient.get('class-groups/', { signal });
}
export function createClassGroup(payload) {
  return schoolsApiClient.post('class-groups/', payload);
}
export function updateClassGroup(id, payload) {
  return schoolsApiClient.patch(`class-groups/${id}/`, payload);
}
export function deleteClassGroup(id) {
  return schoolsApiClient.delete(`class-groups/${id}/`);
}