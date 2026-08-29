import { defineConfig, mergeConfig } from "vite";
import { defineConfig as defineTestConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const baseConfig = defineConfig({
  plugins: [react()],
  base: "/static/schools/",
  build: {
    outDir: "../static/schools",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/index.js",
        assetFileNames: "assets/index.[ext]",
      },
    },
  },
});

export default mergeConfig(
  baseConfig,
  defineTestConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/__tests__/setup.js"],
      include: ["src/__tests__/**/*.test.{js,jsx}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        thresholds: { lines: 60, branches: 60 },
        exclude: ["node_modules/**", "src/__tests__/**", "*.config.*", "dist/**"],
      },
    },
  }),
);