import { defineConfig } from '@playwright/test';

const browserChannel = process.env.CI ? undefined : 'chrome';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    channel: browserChannel,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'mobile-320',
      use: { viewport: { width: 320, height: 720 }, deviceScaleFactor: 1 }
    },
    {
      name: 'mobile-375',
      use: { viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 }
    },
    {
      name: 'tablet-768',
      use: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 }
    },
    {
      name: 'desktop-1440',
      use: { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 }
    }
  ],
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
