import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use the 'bun' pool for native Bun support
    pool: "forks",
  },
});
