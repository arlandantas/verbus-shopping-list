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
    icons: { src: string }[]
  }
  expect(m.id).toBe('/sub/')
  expect(m.start_url).toBe('/sub/')
  expect(m.scope).toBe('/sub/')
  for (const i of m.icons) {
    expect(new URL(i.src, `http://x${m.start_url}`).pathname.startsWith('/sub/icons/')).toBe(true)
  }
  const html = readFileSync(join(out, 'index.html'), 'utf8')
  const light =
    /<meta name="theme-color" content="([^"]+)" media="\(prefers-color-scheme: light\)"/.exec(html)
  expect(light?.[1]).toBeTruthy()
  expect(m.theme_color).toBe(light?.[1])
  expect(m.background_color).toBe(light?.[1])
  expect(html).toMatch(/rel="apple-touch-icon" href="\/sub\/icons\/icon-192\.png"/)
  expect(html).toMatch(
    /rel="icon"[^>]*href="\/sub\/icons\/icon-192\.png"|href="\/sub\/icons\/icon-192\.png"[^>]*rel="icon"/,
  )
  expect(html).toMatch(/href="\/sub\/manifest\.webmanifest"/)
  expect(html).not.toMatch(/(href|src)="\/(icons|assets)\//)
}, 120_000)
