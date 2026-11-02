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
  // S-116 AC2: the modal covers the bottom navigation and the page does not scroll
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const navBox = await page.getByRole('navigation', { name: strings.nav.label }).boundingBox()
  const topmostIsModal = await page.evaluate(
    ({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.m3-overlay'),
    { x: navBox!.x + navBox!.width / 2, y: navBox!.y + navBox!.height / 2 },
  )
  expect(topmostIsModal).toBe(true)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
  await page.getByRole('button', { name: strings.welcome.skip }).click()
  await expect(page).toHaveURL(/\/sugestao$/)
  await page.getByRole('button', { name: strings.suggest.empty }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/boas-vindas')
  await expect(page).toHaveURL(/\/$/)
})

test('S-111 AC3: suggested items land in the list with their category', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await page.getByRole('button', { name: strings.welcome.skip }).click()
  await expect(page).toHaveURL(/\/sugestao$/)
  await page.getByRole('button', { name: /^Utilidades/ }).click()
  await page.getByRole('checkbox', { name: 'Lâmpada' }).uncheck()
  await page.getByRole('button', { name: strings.suggest.add(95) }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('region', { name: 'Utilidades' })).toBeVisible()
  await expect(page.getByText('Arroz')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Alimentos' })).toBeVisible()
})
