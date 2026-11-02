import { devices, expect, test } from '@playwright/test'

test.use({ ...devices['Pixel 7'], serviceWorkers: 'allow' })

test('S-082 AC1: app opens offline under /sub/ and on a deep route', async ({ page, context }) => {
  await page.goto('/sub/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await context.setOffline(true)
  for (const path of ['/sub/', '/sub/index.html', '/sub/historico', '/sub/grupo']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})

test('S-082 AC4: Google/emulator requests are never served by the SW', async ({ page }) => {
  await page.goto('/sub/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  const served: string[] = []
  const seen: string[] = []
  page.on('response', (r) => {
    const u = r.url()
    if (/googleapis\.com|127\.0\.0\.1:(9099|8080)|localhost:(9099|8080)/.test(u)) {
      seen.push(u)
      if (r.fromServiceWorker()) served.push(u)
    }
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(served).toEqual([])
})
