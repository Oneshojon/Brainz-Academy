import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
vi.mock('../api/client', () => ({ default: mockClient }));

const { listPlans, registerSchool } = await import('../api/schoolsApi');

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