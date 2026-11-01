import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  workers: 1, // tests share one emulator and wipe it between runs
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: [
    {
      command: 'pnpm build --mode development && pnpm vite preview --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Vite dev server (StrictMode on); reuses the one from `pnpm dev:local` when running
      command: 'pnpm exec vite --mode development --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/overlay-dev.spec.ts',
      use: { browserName: 'chromium' },
    },
    {
      name: 'dev-server',
      testMatch: '**/overlay-dev.spec.ts',
      use: { browserName: 'chromium', baseURL: 'http://localhost:5173' },
    },
  ],
})
