// Global test setup — runs before every test file in this package.
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

document.cookie = 'csrftoken=test-csrf-token';

afterEach(() => {
  vi.clearAllMocks();
});