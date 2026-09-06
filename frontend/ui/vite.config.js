import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/static/frontend/",
  build: {
    outDir: "../static/frontend",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // frontend/templates/frontend/index.html hardcodes
        // <script src="{% static 'frontend/assets/index.js' %}"> rather
        // than reading a Vite manifest, so the ENTRY file name must stay
        // fixed at assets/index.js.
        //
        // chunkFileNames must NOT reuse that same fixed name: once any
        // route/component is code-split (React.lazy(), dynamic import()),
        // Rollup emits additional chunk files alongside the entry, and a
        // literal "assets/index.js" for every chunk causes them to
        // collide/overwrite the entry on build. Hashed chunk names are
        // safe here -- the entry bundle references each chunk by its
        // actual built URL at runtime, so nothing else hardcodes a chunk
        // filename the way index.html hardcodes the entry's.
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/index.[ext]",
      },
    },
  },
  // `vite build` reads this file directly. `vitest`/`npm test`, however,
  // ignores this file's `test` key entirely whenever a sibling
  // vitest.config.js exists -- which it does, in this project -- so test
  // settings belong ONLY in vitest.config.js, never here. An earlier
  // version of this file tried to merge in a `test` block via
  // mergeConfig(); it was silently ignored the whole time and has been
  // removed so it doesn't give the false impression it did anything.
});