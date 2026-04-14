import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Exclude Playwright browser tests and all node_modules (including nested ones)
    exclude: ["tests/browser/**", "**/node_modules/**"],
  },
});
