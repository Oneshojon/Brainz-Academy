import { createApiClient } from '@brainz/shared-ui';

const lessonPlansClient = createApiClient('/api/lesson-plans/');

// Subjects are catalog data, not lesson-plan data — reused here from the
// existing GET /api/catalog/subjects/ (same endpoint Test Builder's
// Step2Subject.jsx already uses) rather than adding a new backend
// endpoint. Separate client instance (same shared factory, different
// baseURL) rather than reaching into Test Builder's own api.js, which
// this app deliberately leaves untouched.
const catalogClient = createApiClient('/api/catalog/');

/** GET /api/lesson-plans/ — teacher's own plans (lightweight list shape). */
export function listLessonPlans(signal) {
  return lessonPlansClient.get('', { signal });
}

/**
 * POST /api/lesson-plans/ — create a draft (ungated).
 * @param {object} payload - subject, curriculum, class_level, coverage,
 *   duration_minutes, class_size, student_ability, additional_notes,
 *   school_name (optional — auto-filled server-side for School Plan teachers)
 */
export function createLessonPlan(payload) {
  return lessonPlansClient.post('', payload);
}

/** GET /api/lesson-plans/<id>/ — full plan. */
export function getLessonPlan(id, signal) {
  return lessonPlansClient.get(`${id}/`, { signal });
}

/** DELETE /api/lesson-plans/<id>/ */
export function deleteLessonPlan(id) {
  return lessonPlansClient.delete(`${id}/`);
}

/**
 * POST /api/lesson-plans/<id>/generate/ — the AI-gated step.
 * Cache-first server-side: safe to call again on an already-generated
 * plan, returns { ...plan, cached: true } without a new AI call.
 */
export function generateLessonPlan(id) {
  return lessonPlansClient.post(`${id}/generate/`);
}

/** GET /api/catalog/subjects/ — subjects with at least one question, for the form's dropdown. */
export function listSubjects(signal) {
  return catalogClient.get('subjects/', { signal });
}

/**
 * GET /api/lesson-plans/<id>/download/?format=pdf|docx
 * Returns a Blob (not JSON) — separate responseType from every other
 * call on this client, so it's a one-off axios config override rather
 * than baked into createApiClient's shared response interceptor.
 */
export function downloadLessonPlan(id, format) {
  return lessonPlansClient.get(`${id}/download/`, {
    params: { file_type: format },
    responseType: 'blob',
  });
}