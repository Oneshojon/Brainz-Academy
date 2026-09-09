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

describe('normalizeError overrides', () => {
  it('uses the override forbidden message when the server sends no detail', () => {
    const err = normalizeError(fakeAxiosError(403, null), { forbidden: 'You need to be signed in with the right access for this.' });
    expect(err.message).toBe('You need to be signed in with the right access for this.');
  });

  it('server-provided detail still wins over an override', () => {
    const err = normalizeError(fakeAxiosError(403, { detail: 'Server-specific reason.' }), { forbidden: 'Generic override.' });
    expect(err.message).toBe('Server-specific reason.');
  });

  it('uses the override serviceUnavailable message for 502', () => {
    const err = normalizeError(fakeAxiosError(502, null), { serviceUnavailable: 'The payment provider is temporarily unavailable. Please try again shortly.' });
    expect(err.message).toMatch(/payment provider/i);
  });

  it('uses the override serviceUnavailable message for 503', () => {
    const err = normalizeError(fakeAxiosError(503, null), { serviceUnavailable: 'The payment provider is temporarily unavailable. Please try again shortly.' });
    expect(err.message).toMatch(/payment provider/i);
  });

  it('without overrides, defaults are unchanged (backwards compatible)', () => {
    const err = normalizeError(fakeAxiosError(403, null));
    expect(err.message).toMatch(/don't have access/i);
  });
});