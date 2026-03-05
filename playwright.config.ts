import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "tests/bdd-tests/features/**/*.feature",
  steps: "tests/bdd-tests/steps/**/*.ts",
});

export default defineConfig({
  timeout: 30_000,
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list", { printSteps: false }], ["html"]],
  use: {
    baseURL: process.env.PW_BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
