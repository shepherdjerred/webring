import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use vmThreads pool for better ESM compatibility
    pool: "vmThreads",
    // Don't use Bun's module resolution in tests
    server: {
      deps: {
        inline: ["zod"],
      },
    },
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
