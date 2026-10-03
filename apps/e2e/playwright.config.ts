import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:5173/nix-pnpm-demo/vite/";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  outputDir: "./test-results",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  maxFailures: process.env.CI ? 10 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    testIdAttribute: "data-testid",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "pnpm --filter nix-pnpm-demo-vite dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
