// Global test setup — runs before every test file.
// Extends Vitest's expect with jest-dom matchers (toBeInTheDocument, etc.)
// used implicitly by @testing-library/react assertions across test files.
import '@testing-library/jest-dom/vitest';