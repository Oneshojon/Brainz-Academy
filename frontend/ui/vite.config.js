import { defineConfig, mergeConfig } from "vite";
import { defineConfig as defineTestConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const baseConfig = defineConfig({
  plugins: [react()],
  base: "/static/frontend/",
  build: {
    outDir: "../static/frontend",
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

// Test config is merged in rather than kept in a separate vitest.config.js,
// so there is exactly one source of truth for plugins/build settings and
// the two configs can never silently drift apart.
export default mergeConfig(
  baseConfig,
  defineTestConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test-setup.js"],
      globals: true,
    },
  })
);