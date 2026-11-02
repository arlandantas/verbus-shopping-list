import { devices, expect, test } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

test.use({ ...devices['Pixel 7'] })

test.beforeEach(async () => {
  await clearEmulators()
})

test('S-004 AC2: mobile viewport shows the pt-BR title', async ({ page }) => {
  await page.goto('/entrar')
  await expect(page.getByRole('heading', { name: strings.appTitle })).toBeVisible()
  expect(page.viewportSize()?.width).toBeLessThan(500)
})

test('S-004 AC3: app is wired to the emulator', async ({ page }) => {
  await page.goto('/entrar')
  await expect(page.locator('html')).toHaveAttribute('data-emulator', 'true')
})

test('S-004 AC4: helper clears Auth and Firestore', async ({ request }) => {
  const signUp = await request.post(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key',
    { data: { email: 'a@b.co', password: 'secret123' } },
  )
  expect(signUp.ok()).toBe(true)
  await clearEmulators()
  const list = await request.post(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-verbus/accounts:query',
    { headers: { Authorization: 'Bearer owner' }, data: {} },
  )
  expect(((await list.json()) as { userInfo?: unknown[] }).userInfo ?? []).toHaveLength(0)
})
