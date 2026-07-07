import { defineConfig, devices } from '@playwright/test';

/**
 * Assumes `supabase start` and `pnpm dev` are already running on :3000.
 * Run with `pnpm e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
