import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use forks pool for better isolation
    pool: "forks",
  },
  resolve: {
    // Force fresh module resolution for zod
    dedupe: ["zod"],
  },
  optimizeDeps: {
    // Pre-bundle zod to avoid ESM issues
    include: ["zod"],
  },
});
