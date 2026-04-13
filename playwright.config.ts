import { defineConfig } from '@playwright/test';

const frontendBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4200';
const useWebServer = process.env.PLAYWRIGHT_USE_WEBSERVER === '1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: frontendBaseUrl,
    trace: 'retain-on-failure',
  },
  webServer: useWebServer
    ? {
        command: 'npm run frontend:dev',
        url: frontendBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
