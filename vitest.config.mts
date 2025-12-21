import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use threads pool
    pool: "threads",
    // Inline deps to avoid ESM resolution issues in Bun
    deps: {
      inline: [/./],
    },
  },
});
