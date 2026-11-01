import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { buildCsp } from '../vite/csp'

const dirs: string[] = []
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

function dir(csp: string, name: string): string {
  return csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? ''
}

describe('S-084 AC2: buildCsp', () => {
  const csp = buildCsp({ authDomain: 'app.firebaseapp.com' })
  test('required directives', () => {
    expect(dir(csp, 'default-src')).toBe("default-src 'self'")
    expect(dir(csp, 'script-src')).toBe("script-src 'self' https://apis.google.com")
    for (const o of [
      'https://firestore.googleapis.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://app.firebaseapp.com',
    ])
      expect(dir(csp, 'connect-src')).toContain(o)
    expect(dir(csp, 'frame-src')).toBe('frame-src https://app.firebaseapp.com')
    expect(dir(csp, 'img-src')).toBe("img-src 'self' data:")
    expect(dir(csp, 'object-src')).toBe("object-src 'none'")
    expect(dir(csp, 'base-uri')).toBe("base-uri 'self'")
    expect(dir(csp, 'worker-src')).toBe("worker-src 'self'")
  })
  test('no unsafe-eval; no unsafe-inline in script-src', () => {
    expect(csp).not.toContain('unsafe-eval')
    expect(dir(csp, 'script-src')).not.toContain('unsafe-inline')
  })
  test('emulator origins only with emulator; absent authDomain is graceful', () => {
    expect(csp).not.toContain('127.0.0.1')
    const emu = buildCsp({ emulator: true })
    expect(dir(emu, 'connect-src')).toContain('http://127.0.0.1:* http://localhost:*')
    expect(emu).not.toContain('undefined')
    expect(dir(emu, 'frame-src')).toBe('frame-src http://127.0.0.1:* http://localhost:*')
    expect(dir(buildCsp({}), 'frame-src')).toBe("frame-src 'none'")
  })
})

function build(env: Record<string, string>): string {
  const out = mkdtempSync(join(tmpdir(), 'verbus-csp-'))
  dirs.push(out)
  execSync(`pnpm exec vite build --outDir ${out} --emptyOutDir`, {
    env: { ...process.env, ...env },
    stdio: 'pipe',
  })
  return readFileSync(join(out, 'index.html'), 'utf8')
}

test('S-084 AC1/AC3: build injects CSP from authDomain and the referrer meta', () => {
  const html = build({ VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com' })
  expect(html).toMatch(/http-equiv="Content-Security-Policy"[^>]*https:\/\/app\.firebaseapp\.com/)
  expect(html).not.toContain('127.0.0.1')
  expect(html).toContain('<meta name="referrer" content="strict-origin-when-cross-origin"')
  expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/)
}, 120_000)

test('S-084 AC1: emulator build adds loopback origins to connect-src', () => {
  const html = build({ VITE_USE_EMULATOR: 'true' })
  expect(html).toContain('http://127.0.0.1:* http://localhost:*')
}, 120_000)
