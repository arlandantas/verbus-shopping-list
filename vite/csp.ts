import { loadEnv, type Plugin } from 'vite'

export interface CspOptions {
  authDomain?: string
  emulator?: boolean
}

/** Builds the Content-Security-Policy for the static (GitHub Pages) deploy. Pure. */
export function buildCsp({ authDomain, emulator }: CspOptions): string {
  const auth = authDomain ? [`https://${authDomain}`] : []
  const connect = [
    "'self'",
    'https://firestore.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    ...auth,
    ...(emulator ? ['http://127.0.0.1:*', 'http://localhost:*'] : []),
  ]
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // apis.google.com: Firebase Auth loads gapi (api.js) for signInWithPopup.
    'script-src': ["'self'", 'https://apis.google.com'],
    // 'unsafe-inline' for inline style attributes (React/Tailwind); see ADR-0026.
    'style-src': ["'self'", "'unsafe-inline'"],
    'connect-src': connect,
    'frame-src': auth.length ? auth : ["'none'"],
    'img-src': ["'self'", 'data:'],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ')
}

/** Injects CSP + referrer metas into built HTML only; the dev server is left alone (HMR). */
export function cspPlugin(): Plugin {
  let csp = ''
  return {
    name: 'verbus-csp',
    apply: 'build',
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir || config.root, 'VITE_')
      csp = buildCsp({
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || undefined,
        emulator: env.VITE_USE_EMULATOR === 'true',
      })
    },
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
          injectTo: 'head-prepend',
        },
        {
          tag: 'meta',
          attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}
