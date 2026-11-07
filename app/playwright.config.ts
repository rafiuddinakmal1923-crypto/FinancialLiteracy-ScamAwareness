import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  // Parallel full runs on a busy machine occasionally lose a seeded game or a render timing in one unrelated spec; one retry keeps the gate honest without hiding hard failures.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180_000,
    // Tests cover the finalist screens; VITE_FINALIST=0 runs them against what the live site serves (D45).
    env: { VITE_FINALIST: process.env.VITE_FINALIST ?? '1' },
  },
  use: { baseURL: 'http://localhost:4173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
