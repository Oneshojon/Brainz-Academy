import { defineConfig } from 'vitest/config';

// jsdom (not the bare 'node' environment this package started with) --
// apiClient.test.js is pure logic and would've been fine either way, but
// useApiResource.test.js uses @testing-library/react's renderHook, which
// needs a DOM.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}'],
  },
});