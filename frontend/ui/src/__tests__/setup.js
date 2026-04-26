/**
 * setup.js — runs before every test file.
 * Configures @testing-library/jest-dom matchers and global mocks.
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ── Mock window globals set by Django template ────────────────────────────────
window.USER_ROLE = 'TEACHER'
window.LOGO_URL = '/static/Users/images/brainz_logo.png'
window.CSRF_TOKEN = 'test-csrf-token'
window.FEATURE_FLAGS = { random: true, manual: true }

// ── Mock fetch globally ───────────────────────────────────────────────────────
// Individual tests override this with vi.fn() for specific responses.
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
)

// ── Silence console.error for known React warnings in tests ──────────────────
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('act(...)'))
    ) {
      return
    }
    originalError(...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// ── Reset fetch mock between tests ───────────────────────────────────────────
afterEach(() => {
  vi.clearAllMocks()
})

// ── Mock IntersectionObserver (not available in jsdom) ───────────────────────
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// ── Mock ResizeObserver ───────────────────────────────────────────────────────
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))