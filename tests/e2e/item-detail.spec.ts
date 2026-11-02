import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators, deleteAllItems, seedCategory } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const field = (page: Page) => page.getByLabel(strings.list.addLabel)
const row = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })
const qty = (page: Page) => page.getByLabel(strings.item.quantity)
const sheet = (page: Page) => page.getByRole('dialog', { name: strings.item.sheetTitle })
const save = (page: Page) => page.getByRole('button', { name: strings.item.save })

async function setupWithItem(page: Page, text = '3 kg feijão') {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await page
    .getByRole('navigation', { name: strings.nav.label })
    .getByRole('link', { name: strings.nav.list, exact: true })
    .click()
  await expect(page).toHaveURL(/\/$/)
  await field(page).fill(text)
  await field(page).press('Enter')
  await expect(row(page, text.split(' ').pop()!)).toBeVisible()
}

const openItem = (page: Page, name = 'feijão') =>
  page.getByRole('button', { name: strings.list.edit(name) }).click()
const price = (page: Page) => page.getByLabel(strings.item.price)
const cart = (page: Page) => page.getByLabel(strings.item.inCart)

test('S-021 AC1: edit button opens the sheet with current values; checkbox only marks', async ({
  page,
}) => {
  await setupWithItem(page)
  await page.getByRole('checkbox', { name: 'feijão' }).click()
  await expect(sheet(page)).toHaveCount(0)
  await page.getByRole('checkbox', { name: 'feijão' }).click()
  await openItem(page)
  await expect(sheet(page)).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByLabel(strings.item.name)).toHaveValue('feijão')
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
  await expect(sheet(page)).toHaveCount(0)
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
  await expect(row(page, 'feijão')).toHaveCount(1)
  await page.getByRole('button', { name: strings.item.confirm }).click()
  await expect(sheet(page)).toHaveCount(0)
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await expect(page).toHaveURL(/\/$/)
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
  await expect(sheet(page)).toHaveCount(0)
  await expect(row(page, 'feijão')).toContainText('Tio João')
  await context.setOffline(false)
  await expect(row(page, 'feijão').getByText(strings.list.pendingSync)).toHaveCount(0)
  await page.reload()
  await expect(row(page, 'feijão')).toContainText('4 kg')
  await expect(row(page, 'feijão')).toContainText('Tio João')
})

test('S-021 AC6: /item/xyz leads to the Lista', async ({ page }) => {
  await setupWithItem(page)
  await page.goto('/item/nao-existe')
  await expect(page).toHaveURL(/\/$/)
  await expect(field(page)).toBeVisible()
})

test('S-043 AC3: category set on the item comes back through autocomplete', async ({ page }) => {
  await setupWithItem(page, 'leite')
  await seedCategory('Laticínios')
  await openItem(page, 'leite')
  await page
    .getByRole('combobox', { name: strings.item.category })
    .selectOption({ label: 'Laticínios' })
  await save(page).click()
  await expect(sheet(page)).toHaveCount(0)
  await expect(row(page, 'leite')).toBeVisible()
  await expect(row(page, 'leite').getByText(strings.list.pendingSync)).toHaveCount(0)
  await deleteAllItems()
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await field(page).fill('lei')
  await page.getByRole('option', { name: /leite/ }).click()
  await expect(row(page, 'leite')).toBeVisible()
  await openItem(page, 'leite')
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

test('S-057 AC4 (ADR-0022): price on a pending item shows in the list and survives mark/unmark', async ({
  page,
}) => {
  await setupWithItem(page, 'café')
  await openItem(page, 'café')
  await expect(price(page)).toHaveValue('')
  await price(page).fill('18,90')
  await save(page).click()
  await expect(sheet(page)).toHaveCount(0)
  await expect(row(page, 'café')).toContainText(/R\$\s18,90/)
  await expect(page.getByRole('checkbox', { name: 'café' })).toBeVisible()
  await page.getByRole('checkbox', { name: 'café' }).click()
  await page.getByRole('checkbox', { name: 'café' }).click()
  await expect(page.getByRole('checkbox', { name: 'café' })).not.toBeChecked()
  await expect(row(page, 'café')).toContainText(/R\$\s18,90/)
  await openItem(page, 'café')
  await expect(price(page)).toHaveValue('18,90')
  await expect(cart(page)).not.toBeChecked()
})

test('S-057: "Já coloquei no carrinho" marks the item without touching the value', async ({
  page,
}) => {
  await setupWithItem(page, 'café')
  await openItem(page, 'café')
  await price(page).fill('5,00')
  await cart(page).check()
  await save(page).click()
  await expect(page.getByRole('checkbox', { name: 'café' })).toBeVisible()
  await expect(row(page, 'café')).toContainText(/R\$\s5,00/)
})

test('S-057: Cancelar, Esc and the scrim close the sheet without saving', async ({ page }) => {
  await setupWithItem(page)
  await openItem(page)
  await qty(page).fill('9')
  await page.getByRole('button', { name: strings.item.cancel }).click()
  await expect(sheet(page)).toHaveCount(0)
  await expect(row(page, 'feijão')).toContainText('3 kg')
  await openItem(page)
  await page.keyboard.press('Escape')
  await expect(sheet(page)).toHaveCount(0)
  await openItem(page)
  await page.getByTestId('scrim').click({ position: { x: 5, y: 5 } })
  await expect(sheet(page)).toHaveCount(0)
  await expect(row(page, 'feijão')).toContainText('3 kg')
})

test('S-057 AC7: renaming shows in the list and in suggestions', async ({ page }) => {
  await setupWithItem(page, 'arroz')
  await openItem(page, 'arroz')
  await page.getByLabel(strings.item.name).fill('arroz integral')
  await save(page).click()
  await expect(sheet(page)).toHaveCount(0)
  await expect(row(page, 'arroz integral')).toBeVisible()
  await deleteAllItems()
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await field(page).fill('arroz')
  await expect(page.getByRole('option', { name: /arroz integral/ })).toBeVisible()
})

test('S-057 AC7: a renamed recurring item shows the new name in the Despensa, the old one is gone', async ({
  page,
}) => {
  await setupWithItem(page, 'arroz')
  await openItem(page, 'arroz')
  await page.getByLabel(strings.item.recurring).check()
  await save(page).click()
  await expect(sheet(page)).toHaveCount(0)
  await openItem(page, 'arroz')
  await page.getByLabel(strings.item.name).fill('arroz integral')
  await save(page).click()
  await expect(sheet(page)).toHaveCount(0)
  await expect(row(page, 'arroz integral')).toBeVisible()
  await page.getByRole('link', { name: strings.pantry.link, exact: true }).click()
  const recurring = page.getByRole('list', { name: strings.pantry.listLabel })
  await expect(recurring.getByRole('listitem').filter({ hasText: 'arroz integral' })).toBeVisible()
  await expect(recurring.getByRole('listitem')).toHaveCount(1)
})
