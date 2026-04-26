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
        'src/__tests__/**',
        '*.config.*',
        'dist/**',
      ],
    },
    include: ['src/__tests__/**/*.test.{js,jsx}'],
  },
})