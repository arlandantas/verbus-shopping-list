import { devices, expect, test } from '@playwright/test'
import { skipWelcome } from './support/welcome'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators, makeFamiliesLegacy } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const nav = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: strings.nav.label })
const pantryTab = (page: import('@playwright/test').Page) =>
  nav(page).getByRole('link', { name: strings.pantry.link, exact: true })
const sw = (page: import('@playwright/test').Page) =>
  page.getByRole('switch', { name: strings.family.recurring.label })

test('S-105 AC4: legacy group keeps Despensa; off removes the tab, on brings it back', async ({
  page,
}) => {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await expect(sw(page)).toBeChecked() // create form: default on, with the explanation
  await expect(page.getByText(strings.family.recurring.explain)).toBeVisible()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await skipWelcome(page)
  await expect(pantryTab(page)).toBeVisible()

  await makeFamiliesLegacy() // field absent == on
  await page.reload()
  await expect(pantryTab(page)).toBeVisible()
  await nav(page).getByRole('link', { name: strings.family.title, exact: true }).click()
  await expect(sw(page)).toBeChecked()

  await sw(page).click({ force: true })
  await expect(pantryTab(page)).toHaveCount(0)
  await page.goto('/despensa')
  await expect(sw(page)).toBeVisible() // deep link on a cold load never lands on the pantry
  await expect(page).not.toHaveURL(/despensa/)
  await expect(sw(page)).not.toBeChecked()

  await sw(page).click({ force: true })
  await expect(pantryTab(page)).toBeVisible()
})

test('S-108 AC3: Grupo screen go-to-list, categories and toggle persistence', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill('bia@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await skipWelcome(page)
  await nav(page).getByRole('link', { name: strings.family.title, exact: true }).click()
  await page.getByRole('link', { name: strings.categories.link }).click()
  await expect(page).toHaveURL(/categorias/)
  await page.goBack()
  await sw(page).click({ force: true })
  await expect(pantryTab(page)).toHaveCount(0)
  await page.reload()
  await expect(sw(page)).not.toBeChecked()
  await page.getByRole('button', { name: strings.family.goToList }).click()
  await expect(page).toHaveURL(/\/$/)
})
