/**
 * @brainz/shared-ui — package entry point.
 *
 * Extracted from frontend/ui/src/shared/ during the school-portal build so
 * both frontend/ui (individual-teacher tools) and schools/ui (School Plan
 * portal) consume one copy of the API-client/data-fetching primitives
 * instead of maintaining parallel copies that can drift. Both apps import
 * from '@brainz/shared-ui' (an npm workspace package — see root
 * package.json) rather than a relative path into either app's own src/.
 */

export { createApiClient, ApiError, normalizeError } from './apiClient.js';
export { useApiResource, useApiMutation, invalidateResource } from './useApiResource.js';