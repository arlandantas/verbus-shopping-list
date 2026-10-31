import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  workers: 1, // tests share one emulator and wipe it between runs
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'pnpm build --mode development && pnpm vite preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
