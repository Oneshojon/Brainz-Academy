import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// This package has no build step of its own (see package.json comment) —
// this config exists purely so `npm test -w @brainz/lesson-plan-generator`
// can exercise its components in isolation from either host app, the same
// way frontend/ui and schools/ui each test their own src/.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    // Broad glob from day one — see the note in frontend/ui/vitest.config.js
    // about a narrower glob silently excluding new test files.
    include: ['src/**/*.test.{js,jsx}'],
  },
});