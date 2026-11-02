import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import net from 'node:net'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { cspPlugin } from './vite/csp'

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

/** GitHub Pages has no SPA fallback: a deep link on a first visit (no SW yet) hits 404.html. */
function spa404(): Plugin {
  let outDir = 'dist'
  let root = process.cwd()
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
      root = config.root
    },
    closeBundle() {
      copyFileSync(resolve(root, outDir, 'index.html'), resolve(root, outDir, '404.html'))
    },
  }
}

// Deploy base path (e.g. '/verbus-shopping-list/' on a GitHub project page); '/' by default.
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    emulatorWarning(),
    spa404(),
    cspPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'generateSW',
      manifest: {
        name: 'Nosso Carrinho',
        short_name: 'Nosso Carrinho',
        lang: 'pt-BR',
        display: 'standalone',
        id: base,
        description: 'Lista de compras compartilhada, com modo mercado e uso offline.',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        theme_color: '#0f1511',
        background_color: '#0f1511',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        // Firebase auth handler (/__/) and anything with a file extension are never the app shell.
        navigateFallbackDenylist: [/^\/__\//, /\/[^/?]+\.[^/]+$/],
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
