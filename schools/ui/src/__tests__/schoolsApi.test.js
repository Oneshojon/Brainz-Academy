import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Mocking '@brainz/shared-ui' directly (a bare specifier resolved through
 * an npm workspace symlink) doesn't reliably intercept here -- Vite's
 * dependency pre-bundling can hand schoolsApi.js the real module before
 * Vitest's mock applies, so axios ends up making a genuine HTTP request
 * (visible as jsdom's "Not implemented: navigation" / AggregateError).
 * Mocking 'axios' itself -- a real, non-symlinked node_modules package --
 * sidesteps that entirely and is the same category of mock Vitest handles
 * reliably elsewhere in this codebase.
 */
const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
vi.mock('axios', () => ({
  default: {
    create: () => ({
      ...mockClient,
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
}));

const { listPlans, registerSchool, SCHOOLS_ERROR_MESSAGES } = await import('../api/schoolsApi');
const { normalizeError } = await import('@brainz/shared-ui');

describe('schoolsApi', () => {
  beforeEach(() => {
    Object.values(mockClient).forEach((fn) => fn.mockReset());
  });

  it('listPlans calls GET plans/ and returns the response', async () => {
    mockClient.get.mockResolvedValue({ plans: [{ id: 1 }] });
    const result = await listPlans();
    expect(mockClient.get).toHaveBeenCalledWith('plans/', { signal: undefined });
    expect(result).toEqual({ plans: [{ id: 1 }] });
  });

  it('registerSchool calls POST register/ with the payload', async () => {
    mockClient.post.mockResolvedValue({ authorization_url: 'https://x', school_id: 1 });
    const payload = { name: 'X', state: 'Lagos', contact_email: 'a@b.com', plan_id: 1 };
    await registerSchool(payload);
    expect(mockClient.post).toHaveBeenCalledWith('register/', payload);
  });
});

describe('SCHOOLS_ERROR_MESSAGES', () => {
  /**
   * Moved here from the old client.test.js, which asserted these exact
   * strings against the (now-deleted) local api/client.js. This app's
   * registration flow talks to Paystack, not an AI service -- these
   * assertions are what guarantee @brainz/shared-ui's generic AI-context
   * defaults never silently leak into this app's error banners.
   */
  it('overrides the generic 403 fallback with a sign-in-specific message', () => {
    const err = normalizeError({ response: { status: 403, data: null } }, SCHOOLS_ERROR_MESSAGES);
    expect(err.message).toMatch(/signed in/i);
  });

  it('overrides the generic 502/503 fallback with a payment-provider-specific message', () => {
    const err502 = normalizeError({ response: { status: 502, data: null } }, SCHOOLS_ERROR_MESSAGES);
    const err503 = normalizeError({ response: { status: 503, data: null } }, SCHOOLS_ERROR_MESSAGES);
    expect(err502.message).toMatch(/payment provider/i);
    expect(err503.message).toMatch(/payment provider/i);
  });

  it('server-provided detail still wins over the override', () => {
    const err = normalizeError(
      { response: { status: 400, data: { contact_email: ['Enter a valid email.'] } } },
      SCHOOLS_ERROR_MESSAGES,
    );
    expect(err.fieldErrors).toEqual({ contact_email: ['Enter a valid email.'] });
    expect(err.message).toBe('Please fix the highlighted fields.');
  });
});