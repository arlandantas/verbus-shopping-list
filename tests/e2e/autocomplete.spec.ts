import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators, deleteAllItems } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

async function setupFamily(page: Page) {
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await expect(page).toHaveURL(/\/grupo$/)
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await expect(page.getByTestId('invite-code')).toBeVisible()
  await page
    .getByRole('navigation', { name: strings.nav.label })
    .getByRole('link', { name: strings.nav.list, exact: true })
    .click()
  await expect(page).toHaveURL(/\/$/)
}

const field = (page: Page) => page.getByLabel(strings.list.addLabel)
const row = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })
const option = (page: Page, name: string) => page.getByRole('option', { name })

/** Adds "2 kg feijão", then removes the item so only the catalog remembers it. */
async function seedFeijao(page: Page) {
  await setupFamily(page)
  await field(page).fill('2 kg feijão')
  await field(page).press('Enter')
  await expect(row(page, 'feijão')).toContainText('2 kg')
  await expect(row(page, 'feijão').getByText(strings.list.pendingSync)).toHaveCount(0)
  await deleteAllItems()
  await expect(page.getByRole('listitem')).toHaveCount(0)
}

test('S-020 AC3: suggestion shows "feijão · 2 kg"; tapping adds it with 2 kg', async ({ page }) => {
  await seedFeijao(page)
  await field(page).fill('fei')
  const opt = option(page, 'feijão · 2 kg')
  await expect(opt).toBeVisible()
  expect((await opt.boundingBox())!.height).toBeGreaterThanOrEqual(48)
  await opt.click()
  await expect(row(page, 'feijão')).toContainText('2 kg')
  await expect(field(page)).toHaveValue('')
})

test('S-020 AC4: typed quantity wins over the catalog one', async ({ page }) => {
  await seedFeijao(page)
  await field(page).fill('5 kg fei')
  await option(page, 'feijão · 2 kg').click()
  await expect(row(page, 'feijão')).toContainText('5 kg')
  await expect(row(page, 'feijão')).not.toContainText('2 kg')
})

test('S-020 AC5: works offline; disappears on clear and on Esc', async ({ page, context }) => {
  await seedFeijao(page)
  await context.setOffline(true)
  await field(page).fill('fei')
  await expect(page.getByRole('listbox')).toBeVisible()
  await expect(option(page, 'feijão · 2 kg')).toBeVisible()
  await field(page).fill('')
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await field(page).fill('fei')
  await expect(page.getByRole('listbox')).toBeVisible()
  await field(page).press('Escape')
  await expect(page.getByRole('listbox')).toHaveCount(0)
})

test('ADR-0009: arrow keys + Enter pick a suggestion; Escape closes the list', async ({ page }) => {
  await seedFeijao(page)
  await field(page).fill('fei')
  await expect(field(page)).toHaveAttribute('aria-expanded', 'true')
  await field(page).press('ArrowDown')
  await expect(option(page, 'feijão · 2 kg')).toHaveAttribute('aria-selected', 'true')
  await field(page).press('Enter')
  await expect(row(page, 'feijão')).toContainText('2 kg')
  await field(page).fill('fei')
  await field(page).press('Escape')
  await expect(field(page)).toHaveAttribute('aria-expanded', 'false')
})
