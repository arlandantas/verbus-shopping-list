import { devices, expect, test } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { skipWelcome } from './support/welcome'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

test('S-118 AC4: the owner renames the group and the title changes', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await skipWelcome(page)
  await page.goto('/grupo')
  await page.getByRole('button', { name: new RegExp(strings.family.rename.row) }).click()
  const dialog = page.getByRole('dialog', { name: strings.family.rename.title })
  await dialog.getByLabel(strings.family.nameLabel).fill('Nossa Casa')
  await dialog.getByRole('button', { name: strings.family.rename.save }).click()
  await expect(page.getByRole('heading', { name: 'Nossa Casa', level: 1 })).toBeVisible()
})
