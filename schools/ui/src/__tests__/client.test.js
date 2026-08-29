import { describe, it, expect } from 'vitest';
import { normalizeError, ApiError } from '../api/client';

describe('normalizeError', () => {
  it('maps a network failure (no response) to a connectivity message', () => {
    const err = normalizeError({ response: undefined });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toMatch(/could not reach the server/i);
  });

  it('maps a 404 feature-flag-off response using the server message', () => {
    const err = normalizeError({
      response: { status: 404, data: { error: 'School Plan is not currently available.' } },
    });
    expect(err.status).toBe(404);
    expect(err.message).toBe('School Plan is not currently available.');
  });

  it('maps a 400 to fieldErrors without leaking raw DRF shape into .message', () => {
    const err = normalizeError({
      response: { status: 400, data: { contact_email: ['Enter a valid email.'] } },
    });
    expect(err.status).toBe(400);
    expect(err.fieldErrors).toEqual({ contact_email: ['Enter a valid email.'] });
    expect(err.message).toBe('Please fix the highlighted fields.');
  });

  it('maps 403 to an access message', () => {
    const err = normalizeError({ response: { status: 403, data: null } });
    expect(err.status).toBe(403);
    expect(err.message).toMatch(/signed in/i);
  });

  it('maps 502/503 to a retry-friendly Paystack message', () => {
    const err502 = normalizeError({ response: { status: 502, data: null } });
    const err503 = normalizeError({ response: { status: 503, data: null } });
    expect(err502.message).toMatch(/temporarily unavailable/i);
    expect(err503.message).toMatch(/temporarily unavailable/i);
  });
});