import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 120000,
  expect: { timeout: 20000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    channel: "chromium",
    headless: true,
    actionTimeout: 20000,
    trace: "retain-on-failure",
  },
  reporter: "list",
});
