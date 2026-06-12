import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Config for LIVE-DB verification tests (scripts/*.livetest.ts) — run only
 * deliberately via `npx vitest run --config vitest.live.config.ts`.
 * Never wired into `npm test` or CI: these touch the real database
 * (throwaway, self-created documents only).
 */
export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["scripts/**/*.livetest.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
