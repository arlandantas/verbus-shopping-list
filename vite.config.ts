import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // data project is added by a later story (ADR-0006)
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          include: ['src/**/*.test.{ts,tsx}', 'tests/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'rules',
          environment: 'node',
          globals: true,
          include: ['tests/rules/**/*.test.ts'],
        },
      },
    ],
  },
})
