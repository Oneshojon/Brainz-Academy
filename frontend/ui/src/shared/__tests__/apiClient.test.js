import { describe, it, expect } from 'vitest';
import { normalizeError, ApiError } from '../apiClient';

function fakeAxiosError(status, data) {
  return { response: { status, data } };
}

describe('normalizeError', () => {
  it('returns a network-error message when there is no response', () => {
    const err = normalizeError({ response: undefined });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toMatch(/check your connection/i);
  });

  it('surfaces the admin-disabled message for 404 + error', () => {
    const err = normalizeError(fakeAxiosError(404, { error: 'The Lesson Plan Generator is currently disabled by the admin.' }));
    expect(err.status).toBe(404);
    expect(err.message).toBe('The Lesson Plan Generator is currently disabled by the admin.');
  });

  it('captures DRF field errors for 400 responses', () => {
    const err = normalizeError(fakeAxiosError(400, { duration_minutes: ['Duration must be between 1 and 300 minutes.'] }));
    expect(err.status).toBe(400);
    expect(err.fieldErrors.duration_minutes[0]).toMatch(/300 minutes/);
    expect(err.message).toMatch(/highlighted fields/i);
  });

  it('surfaces the permission message for 403 responses', () => {
    const err = normalizeError(fakeAxiosError(403, { detail: 'Lesson Plan Generator is only available to teachers.' }));
    expect(err.status).toBe(403);
    expect(err.message).toBe('Lesson Plan Generator is only available to teachers.');
  });

  it('gives a retry-friendly message for 503', () => {
    const err = normalizeError(fakeAxiosError(503, { error: 'AI lesson plan generation is temporarily unavailable.' }));
    expect(err.status).toBe(503);
    expect(err.message).toMatch(/temporarily unavailable/i);
  });

  it('falls back to a generic message when the server gives nothing usable', () => {
    const err = normalizeError(fakeAxiosError(500, {}));
    expect(err.status).toBe(500);
    expect(err.message).toMatch(/something went wrong/i);
  });
});