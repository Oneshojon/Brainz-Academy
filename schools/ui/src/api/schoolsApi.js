import schoolsApiClient from './client';

/**
 * School Plan API surface — one function per endpoint from the frontend
 * handoff doc. Admin-management functions are included now so the full
 * contract lives in one file, even though only the public + registration
 * flow is wired to UI this pass.
 */

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