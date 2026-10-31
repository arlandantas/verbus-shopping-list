import { devices, expect, test } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'

test.use({ ...devices['Pixel 7'], serviceWorkers: 'allow' })

async function loadWithServiceWorker(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload() // the first load is not controlled until the SW claims clients
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
}

test('S-005 AC1: manifest is installable', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest')
  expect(res.ok()).toBe(true)
  const m = (await res.json()) as {
    name: string
    short_name: string
    lang: string
    display: string
    start_url: string
    theme_color: string
    icons: { sizes: string; type: string; purpose?: string }[]
  }
  expect(m.name).toBeTruthy()
  expect(m.short_name).toBeTruthy()
  expect(m.lang).toBe('pt-BR')
  expect(m.display).toBe('standalone')
  expect(m.start_url).toBe('/')
  expect(m.theme_color).toBeTruthy()
  for (const sizes of ['192x192', '512x512']) {
    expect(m.icons.some((i) => i.sizes === sizes && i.type === 'image/png')).toBe(true)
  }
  expect(m.icons.some((i) => i.purpose?.split(' ').includes('maskable'))).toBe(true)
})

test('S-005 AC2: service worker controls the page', async ({ page }) => {
  await loadWithServiceWorker(page)
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
})

test('S-005 AC3: app shell reloads offline, including deep routes', async ({ page, context }) => {
  await loadWithServiceWorker(page)
  await context.setOffline(true)
  for (const path of ['/', '/familia']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: strings.appTitle })).toBeVisible()
  }
})

test('S-005 AC5: offline badge appears and disappears', async ({ page, context }) => {
  await loadWithServiceWorker(page)
  await expect(page.getByText(strings.offline)).toBeHidden()
  await context.setOffline(true)
  await expect(page.getByText(strings.offline)).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByText(strings.offline)).toBeHidden()
})
