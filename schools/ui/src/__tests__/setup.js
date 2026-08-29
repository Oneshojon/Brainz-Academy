/**
 * setup.js — runs before every test file.
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

window.USER_ROLE = '';
window.LOGO_URL = '/static/Users/images/brainz_logo.png';
window.IS_AUTHENTICATED = true;

document.cookie = 'csrftoken=test-csrf-token';

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('act(...)')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
afterEach(() => {
  vi.clearAllMocks();
});