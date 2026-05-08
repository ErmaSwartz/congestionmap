import { defineConfig } from "astro/config";

// Site lives at https://ermaswartz.github.io/congestionmap/
// Pages output is plain static HTML; no SSR adapters needed.
export default defineConfig({
  site: "https://ermaswartz.github.io",
  base: "/congestionmap",
  trailingSlash: "ignore",
  build: {
    format: "directory",   // /01-air/index.html instead of /01-air.html
  },
  vite: {
    server: { fs: { strict: false } },
  },
});
