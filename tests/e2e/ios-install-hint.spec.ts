import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const hint = (page: Page) =>
  page.getByRole('note').filter({ hasText: 'Adicionar à Tela de Início' })

async function signUp(page: Page) {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await expect(page).toHaveURL(/\/grupo$/)
}

test.describe('iPhone Safari', () => {
  test.use({ userAgent: IPHONE_UA })

  test('S-080 AC5: hint on login and in the shell; dismissal persists across reload', async ({
    page,
  }) => {
    await page.goto('/entrar')
    await expect(page).toHaveURL(/\/entrar$/)
    await expect(hint(page)).toBeVisible()
    await signUp(page)
    await expect(hint(page)).toBeVisible()
    await page.getByLabel(strings.family.nameLabel).fill('Casa')
    await page.getByRole('button', { name: strings.family.create }).click()
    await expect(hint(page)).toBeVisible()
    await page.getByRole('link', { name: strings.nav.list, exact: true }).click()
    await expect(hint(page)).toBeVisible()
    // AC6: does not cover the tab bar
    const nav = page.getByRole('navigation', { name: strings.nav.label })
    const h = (await hint(page).boundingBox())!
    const n = (await nav.boundingBox())!
    expect(h.y + h.height).toBeLessThanOrEqual(n.y)
    const close = page.getByRole('button', { name: strings.iosInstall.close })
    expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(48)
    await close.click()
    await expect(hint(page)).toHaveCount(0)
    await page.reload()
    await expect(page.getByLabel(strings.list.addLabel)).toBeVisible()
    await expect(hint(page)).toHaveCount(0)
  })
})

test.describe('Pixel 7 default UA', () => {
  test('S-080 AC5: hint is absent', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.getByLabel(strings.login.email)).toBeVisible()
    await expect(hint(page)).toHaveCount(0)
  })
})
