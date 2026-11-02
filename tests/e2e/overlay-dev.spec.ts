import { devices, expect, test, type Page } from '@playwright/test'
import { skipWelcome } from './support/welcome'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

// Runs against the Vite dev server (StrictMode double-invokes effects), unlike `vite preview`.
test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const field = (page: Page) => page.getByLabel(strings.list.addLabel)
const sheet = (page: Page) => page.getByRole('dialog', { name: strings.item.sheetTitle })

test('S-069 AC3: edit sheet opens and stays open on the dev server; Cancel closes', async ({
  page,
}) => {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await skipWelcome(page)
  await page
    .getByRole('navigation', { name: strings.nav.label })
    .getByRole('link', { name: strings.nav.list, exact: true })
    .click()
  await field(page).fill('3 kg feijão')
  await field(page).press('Enter')
  await page.getByRole('button', { name: strings.list.edit('feijão') }).click()
  await expect(sheet(page)).toBeVisible()
  await page.waitForTimeout(500)
  await expect(sheet(page)).toBeVisible()
  await page.getByRole('button', { name: strings.item.cancel }).click()
  await expect(sheet(page)).toHaveCount(0)
})
