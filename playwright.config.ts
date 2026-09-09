import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-iphone",
      use: {
        browserName: "chromium",
        viewport: devices["iPhone 14"].viewport,
        userAgent: devices["iPhone 14"].userAgent,
        deviceScaleFactor: devices["iPhone 14"].deviceScaleFactor,
        isMobile: devices["iPhone 14"].isMobile,
        hasTouch: devices["iPhone 14"].hasTouch,
        launchOptions: { executablePath: "/opt/pw-browsers/chromium" },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
