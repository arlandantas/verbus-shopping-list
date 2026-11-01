import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import net from 'node:net'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/** Dev-server hint: warns when emulator mode is on but the Auth emulator (9099) is unreachable. */
function emulatorWarning(): Plugin {
  return {
    name: 'warn-missing-auth-emulator',
    apply: 'serve',
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), 'VITE_')
      if (env.VITE_USE_EMULATOR !== 'true' || process.env.VITEST) return
      const sock = net.connect({ port: 9099, host: '127.0.0.1' })
      sock.once('connect', () => sock.destroy())
      sock.once('error', () =>
        config.logger.warn(
          '[verbus] VITE_USE_EMULATOR=true but the Auth emulator (localhost:9099) is not running; login will fail. Use `pnpm dev:local`.',
        ),
      )
    },
  }
}

export default defineConfig({
  plugins: [
    emulatorWarning(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      manifest: {
        name: 'Lista de Compras',
        short_name: 'Compras',
        lang: 'pt-BR',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        // Firestore/Auth traffic is handled by the Firebase SDK, never by the SW.
        runtimeCaching: [],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
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
      {
        // Data layer against the Auth + Firestore emulators (real rules). The app's firebase
        // init (IndexedDB cache, DOM) is swapped for a node-friendly one.
        extends: true,
        resolve: {
          alias: [
            {
              find: '@/data/firebase',
              replacement: fileURLToPath(new URL('./tests/data/support.ts', import.meta.url)),
            },
          ],
        },
        test: {
          name: 'data',
          environment: 'node',
          globals: true,
          include: ['tests/data/**/*.test.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
})
