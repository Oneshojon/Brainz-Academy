import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 60,
        branches: 60,
      },
      exclude: [
        'node_modules/**',
        '**/__tests__/**',
        '*.config.*',
        'dist/**',
      ],
    },
    // Was 'src/__tests__/**/*.test.{js,jsx}' -- scoped to exactly the one
    // __tests__ folder that existed at the time. That silently excluded
    // every test added under a feature's own __tests__ folder (e.g.
    // src/features/lessonPlans/__tests__/, src/shared/__tests__/) --
    // Vitest found zero matches there and said nothing, so `npm test`
    // kept reporting a clean pass while those suites never ran at all.
    // Broadened to match any *.test.{js,jsx} anywhere under src/, however
    // a given feature organizes its own tests.
    include: ['src/**/*.test.{js,jsx}'],
  },
})