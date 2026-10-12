import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3001',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  webServer: {
    command: 'npx ts-node src/server/mockServer.ts',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
