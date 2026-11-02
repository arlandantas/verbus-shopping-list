import { devices, expect, test } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

test('S-110 AC3: welcome shows after creating a group, skip goes to the list, no repeat on reload', async ({
  page,
}) => {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await expect(page).toHaveURL(/\/boas-vindas$/)
  await expect(page.getByRole('heading', { name: strings.welcome.steps[0].title })).toBeVisible()
  await page.getByRole('button', { name: strings.welcome.skip }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/boas-vindas')
  await expect(page).toHaveURL(/\/$/)
})
