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
        // schools/templates/schools/index.html hardcodes
        // {% static 'schools/assets/index.js' %} / index.css rather than
        // reading a Vite manifest, so the ENTRY js/css filenames must
        // stay fixed -- same constraint as frontend/ui's vite.config.js.
        //
        // chunkFileNames must NOT reuse that same fixed name: this app
        // is about to lazy-load @brainz/lesson-plan-generator via
        // React.lazy(), which makes Rollup emit an additional chunk file
        // alongside the entry. A literal "assets/index.js" for every
        // chunk would collide with (and silently overwrite) the entry on
        // build. Hashed chunk names are safe -- the entry bundle
        // references each chunk by its actual built URL at runtime, so
        // nothing else hardcodes a chunk filename the way index.html
        // hardcodes the entry's.
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name]-[hash].js",
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
      // Broadened from "src/__tests__/**/*.test.{js,jsx}" -- that glob
      // happened to work so far only because every test file in this app
      // has lived in src/__tests__/ by convention, but a narrow glob like
      // that silently excludes any future co-located test file with zero
      // warning. This still finds everything under __tests__/ too.
      include: ["src/**/*.test.{js,jsx}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        thresholds: { lines: 60, branches: 60 },
        exclude: ["node_modules/**", "src/__tests__/**", "*.config.*", "dist/**"],
      },
    },
  }),
);