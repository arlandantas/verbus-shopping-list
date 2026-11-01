import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'

test('S-081 AC3: build under VITE_BASE=/sub/ resolves manifest and html links under /sub/', () => {
  const out = mkdtempSync(join(tmpdir(), 'verbus-dist-'))
  execSync(`pnpm exec vite build --outDir ${out} --emptyOutDir`, {
    env: { ...process.env, VITE_BASE: '/sub/' },
    stdio: 'pipe',
  })
  const m = JSON.parse(readFileSync(join(out, 'manifest.webmanifest'), 'utf8')) as {
    id: string
    start_url: string
    scope: string
    icons: { src: string }[]
  }
  expect(m.id).toBe('/sub/')
  expect(m.start_url).toBe('/sub/')
  expect(m.scope).toBe('/sub/')
  for (const i of m.icons) {
    expect(new URL(i.src, `http://x${m.start_url}`).pathname.startsWith('/sub/icons/')).toBe(true)
  }
  const html = readFileSync(join(out, 'index.html'), 'utf8')
  expect(html).toMatch(/rel="apple-touch-icon" href="\/sub\/icons\/icon-192\.png"/)
  expect(html).toMatch(
    /rel="icon"[^>]*href="\/sub\/icons\/icon-192\.png"|href="\/sub\/icons\/icon-192\.png"[^>]*rel="icon"/,
  )
  expect(html).toMatch(/href="\/sub\/manifest\.webmanifest"/)
  expect(html).not.toMatch(/(href|src)="\/(icons|assets)\//)
}, 120_000)
