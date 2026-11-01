import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators, deleteAllItems } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const field = (page: Page) => page.getByLabel(strings.list.addLabel)
const row = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })
const qty = (page: Page) => page.getByLabel(strings.item.quantity)
const save = (page: Page) => page.getByRole('button', { name: strings.item.save })

async function setupWithItem(page: Page, text = '3 kg feijão') {
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await page.getByRole('button', { name: strings.family.continue }).click()
  await expect(page).toHaveURL(/\/$/)
  await field(page).fill(text)
  await field(page).press('Enter')
  await expect(row(page, text.split(' ').pop()!)).toBeVisible()
}

const openItem = (page: Page) => page.getByRole('link', { name: 'feijão' }).click()

test('S-021 AC1: tapping the name opens /item/:id with current values; checkbox only marks', async ({
  page,
}) => {
  await setupWithItem(page)
  await page.getByRole('checkbox', { name: strings.list.markBought('feijão') }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole('checkbox', { name: strings.list.markPending('feijão') }).click()
  await openItem(page)
  await expect(page).toHaveURL(/\/item\/[^/]+$/)
  await expect(qty(page)).toHaveValue('3')
  await expect(page.getByLabel(strings.item.unit)).toHaveValue('kg')
})

test('S-021 AC2: edits save and show in the list', async ({ page }) => {
  await setupWithItem(page)
  await openItem(page)
  await qty(page).fill('1,5')
  await page.getByLabel(strings.item.unit).selectOption('kg')
  await page.getByLabel(strings.item.note).fill('Camil')
  await page.getByLabel(strings.item.recurring).check()
  await save(page).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(row(page, 'feijão')).toContainText('1,5 kg')
  await expect(row(page, 'feijão')).toContainText('Camil')
})

test('S-021 AC3: invalid quantity disables Salvar with a message; note capped at 120', async ({
  page,
}) => {
  await setupWithItem(page)
  await openItem(page)
  for (const v of ['', '0', '10000']) {
    await qty(page).fill(v)
    await expect(save(page)).toBeDisabled()
    await expect(page.getByText(strings.item.quantityInvalid)).toBeVisible()
  }
  await qty(page).fill('2')
  await expect(save(page)).toBeEnabled()
  await page.getByLabel(strings.item.note).fill('x'.repeat(150))
  await expect(page.getByLabel(strings.item.note)).toHaveValue('x'.repeat(120))
})

test('S-021 AC4: Apagar asks for confirmation and removes the item', async ({ page }) => {
  await setupWithItem(page)
  await openItem(page)
  await page.getByRole('button', { name: strings.item.delete }).click()
  await expect(page).toHaveURL(/\/item\//)
  await page.getByRole('button', { name: strings.item.confirm }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('S-021 AC5: offline save returns at once and persists after reconnect', async ({
  page,
  context,
}) => {
  await setupWithItem(page)
  await openItem(page)
  await context.setOffline(true)
  await qty(page).fill('4')
  await page.getByLabel(strings.item.note).fill('Tio João')
  await save(page).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(row(page, 'feijão')).toContainText('Tio João')
  await context.setOffline(false)
  await expect(row(page, 'feijão').getByText(strings.list.pendingSync)).toHaveCount(0)
  await page.reload()
  await expect(row(page, 'feijão')).toContainText('4 kg')
  await expect(row(page, 'feijão')).toContainText('Tio João')
})

test('S-021 AC6: unknown id shows "Item não encontrado" with a link to the list', async ({
  page,
}) => {
  await setupWithItem(page)
  await page.goto('/item/nao-existe')
  await expect(page.getByText(strings.item.notFound)).toBeVisible()
  await page.getByRole('link', { name: strings.item.toList }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('S-043 AC3: category set on the item comes back through autocomplete', async ({ page }) => {
  await setupWithItem(page, 'leite')
  await page.getByRole('link', { name: 'leite' }).click()
  await page
    .getByRole('combobox', { name: strings.item.category })
    .selectOption({ label: 'Laticínios' })
  await save(page).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(row(page, 'leite')).toBeVisible()
  await expect(row(page, 'leite').getByText(strings.list.pendingSync)).toHaveCount(0)
  await deleteAllItems()
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await field(page).fill('lei')
  await page.getByRole('option', { name: /leite/ }).click()
  await expect(row(page, 'leite')).toBeVisible()
  await page.getByRole('link', { name: 'leite' }).click()
  await expect(
    page.getByRole('combobox', { name: strings.item.category }).locator('option:checked'),
  ).toHaveText('Laticínios')
})

test('S-043 AC4: free-text add does not ask for a category', async ({ page }) => {
  await setupWithItem(page, 'arroz')
  await expect(page.getByRole('combobox', { name: strings.item.category })).toHaveCount(0)
  await expect(page).toHaveURL(/\/$/)
  await expect(row(page, 'arroz')).toBeVisible()
})
