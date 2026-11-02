import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, expect, test } from 'vitest'

const dirs: string[] = []
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

test('S-081 AC3: build under VITE_BASE=/sub/ resolves manifest and html links under /sub/', () => {
  const out = mkdtempSync(join(tmpdir(), 'verbus-dist-'))
  dirs.push(out)
  execSync(`pnpm exec vite build --outDir ${out} --emptyOutDir`, {
    env: { ...process.env, VITE_BASE: '/sub/' },
    stdio: 'pipe',
  })
  const m = JSON.parse(readFileSync(join(out, 'manifest.webmanifest'), 'utf8')) as {
    id: string
    start_url: string
    scope: string
    theme_color: string
    background_color: string
    icons: { src: string; purpose?: string }[]
  }
  expect(m.id).toBe('/sub/')
  expect(m.start_url).toBe('/sub/')
  expect(m.scope).toBe('/sub/')
  for (const i of m.icons) {
    expect(new URL(i.src, `http://x${m.start_url}`).pathname.startsWith('/sub/icons/')).toBe(true)
  }
  const any = m.icons.filter((i) => i.purpose === 'any').map((i) => i.src)
  const maskable = m.icons.filter((i) => i.purpose === 'maskable').map((i) => i.src)
  expect(any.length).toBeGreaterThan(0)
  expect(maskable.length).toBeGreaterThan(0)
  expect(any.some((src) => maskable.includes(src))).toBe(false) // S-103 AC4: distinct files
  const html = readFileSync(join(out, 'index.html'), 'utf8')
  const dark =
    /<meta name="theme-color" content="([^"]+)" media="\(prefers-color-scheme: dark\)"/.exec(html)
  expect(dark?.[1]).toBeTruthy()
  expect(m.theme_color).toBe(dark?.[1]) // S-104 AC4: system bars follow the dark manifest color
  expect(m.background_color).toBe(dark?.[1])
  expect(html).toMatch(/rel="apple-touch-icon" href="\/sub\/icons\/icon-192\.png"/)
  expect(html).toMatch(
    /rel="icon"[^>]*href="\/sub\/icons\/icon-192\.png"|href="\/sub\/icons\/icon-192\.png"[^>]*rel="icon"/,
  )
  expect(html).toMatch(/href="\/sub\/manifest\.webmanifest"/)
  expect(html).not.toMatch(/(href|src)="\/(icons|assets)\//)
}, 120_000)

test('S-082 AC3/AC5: SW denylist and 404.html equals index.html', () => {
  const out = mkdtempSync(join(tmpdir(), 'verbus-dist-'))
  dirs.push(out)
  execSync(`pnpm exec vite build --outDir ${out} --emptyOutDir`, {
    env: { ...process.env, VITE_BASE: '/sub/' },
    stdio: 'pipe',
  })
  expect(readFileSync(join(out, '404.html'), 'utf8')).toBe(
    readFileSync(join(out, 'index.html'), 'utf8'),
  )
  const sw = readFileSync(join(out, 'sw.js'), 'utf8')
  expect(sw).toMatch(/NavigationRoute/)
  const compact = sw.replace(/\s+/g, '')
  expect(compact).toContain('denylist:[/^\\/__\\//,/\\/[^/?]+\\.[^/]+$/]')
  expect(sw).toMatch(/createHandlerBoundToURL\("index\.html"\)/)
}, 120_000)

test('S-083 AC1: prompt registration, no inline script, waits for SKIP_WAITING message', () => {
  const out = mkdtempSync(join(tmpdir(), 'verbus-dist-'))
  dirs.push(out)
  execSync(`pnpm exec vite build --outDir ${out} --emptyOutDir`, {
    env: { ...process.env, VITE_BASE: '/sub/' },
    stdio: 'pipe',
  })
  const html = readFileSync(join(out, 'index.html'), 'utf8')
  expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>\s*\S/)
  const sw = readFileSync(join(out, 'sw.js'), 'utf8')
  expect(sw).not.toMatch(/clientsClaim\(\)/)
  expect(sw).toMatch(/SKIP_WAITING/)
}, 120_000)
