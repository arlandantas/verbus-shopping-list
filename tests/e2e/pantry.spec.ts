import { devices, expect, test, type Page } from '@playwright/test'
import { skipWelcome } from './support/welcome'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const field = (page: Page) => page.getByLabel(strings.list.addLabel)
const listRow = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })
const pantryRow = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })

async function signUpWithFamily(page: Page) {
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
  await expect(page).toHaveURL(/\/$/)
}

/** Adds "3 kg feijão" and marks it recurring in the detail screen. */
async function addRecurring(page: Page) {
  await field(page).fill('3 kg feijão')
  await field(page).press('Enter')
  await expect(listRow(page, 'feijão')).toBeVisible()
  await page.getByRole('button', { name: strings.list.edit('feijão') }).click()
  await page.getByLabel(strings.item.recurring).check()
  await page.getByRole('button', { name: strings.item.save }).click()
  await expect(page).toHaveURL(/\/$/)
}

const openPantry = async (page: Page) => {
  await page.getByRole('link', { name: strings.pantry.link, exact: true }).click()
  await expect(page).toHaveURL(/\/despensa$/)
}

/** Recurring "feijão" with no item on the list (deleted; catalog keeps the mark). */
async function recurringAtHome(page: Page) {
  await signUpWithFamily(page)
  await addRecurring(page)
  await page.getByRole('button', { name: strings.list.edit('feijão') }).click()
  await page.getByRole('button', { name: strings.item.delete }).click()
  await page.getByRole('button', { name: strings.item.confirm }).click()
  await expect(page).toHaveURL(/\/$/)
  await openPantry(page)
}

test('S-024 AC1: Despensa link opens /despensa and lists the recurring item', async ({ page }) => {
  await signUpWithFamily(page)
  await addRecurring(page)
  await openPantry(page)
  await expect(pantryRow(page, 'feijão')).toBeVisible()
})

test('S-024 AC2: tapping "Tenho em casa" marks Falta and adds a pending item', async ({ page }) => {
  await recurringAtHome(page)
  const row = pantryRow(page, 'feijão')
  await expect(row).toContainText(strings.pantry.atHome)
  await row.getByRole('button', { name: strings.pantry.markMissingFor('feijão') }).click()
  await expect(row).toContainText(strings.pantry.missing)
  await page.getByRole('link', { name: strings.nav.list, exact: true }).click()
  await expect(listRow(page, 'feijão')).toContainText('3 kg')
  await expect(page.getByRole('region', { name: strings.noCategory })).toContainText('feijão')
})

test('S-024 AC3: tapping Falta again returns to Tenho em casa and removes the pending', async ({
  page,
}) => {
  await recurringAtHome(page)
  const row = pantryRow(page, 'feijão')
  await row.getByRole('button').first().click()
  await expect(row).toContainText(strings.pantry.missing)
  await row.getByRole('button').first().click()
  await expect(row).toContainText(strings.pantry.atHome)
  await page.getByRole('link', { name: strings.nav.list, exact: true }).click()
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('S-024 AC4: bought recurring shows No carrinho and is not tappable', async ({ page }) => {
  await signUpWithFamily(page)
  await addRecurring(page)
  await page.getByRole('checkbox', { name: 'feijão' }).click()
  await openPantry(page)
  const row = pantryRow(page, 'feijão')
  await expect(row).toContainText(strings.pantry.inCart)
  await expect(row.getByRole('button').first()).toBeDisabled()
})

test('S-024 AC5: offline Falta reflects at once and persists after reconnect', async ({
  page,
  context,
}) => {
  await recurringAtHome(page)
  const row = pantryRow(page, 'feijão')
  await context.setOffline(true)
  await row.getByRole('button').first().click()
  await expect(row).toContainText(strings.pantry.missing)
  await context.setOffline(false)
  await page.reload()
  await expect(pantryRow(page, 'feijão')).toContainText(strings.pantry.missing)
})

test('S-024 AC6: empty Despensa explains how to mark an item as recurring', async ({ page }) => {
  await signUpWithFamily(page)
  await openPantry(page)
  await expect(page.getByText(strings.pantry.empty)).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

const others = (page: Page) => page.getByRole('list', { name: strings.pantry.othersTitle })
const recurringList = (page: Page) => page.getByRole('list', { name: strings.pantry.listLabel })

/** Adds an unmarked "3 kg feijão" (catalog entry, not recurring) and opens the Despensa. */
async function usedNotRecurring(page: Page) {
  await signUpWithFamily(page)
  await field(page).fill('3 kg feijão')
  await field(page).press('Enter')
  await expect(listRow(page, 'feijão')).toBeVisible()
  await openPantry(page)
}

async function makeRecurring(page: Page) {
  await page.getByText(strings.pantry.othersTitle).click()
  await others(page)
    .getByRole('listitem')
    .filter({ hasText: 'feijão' })
    .getByRole('button', { name: strings.pantry.makeRecurring })
    .click()
}

test('S-025 AC1: "Outros itens já usados" lists non-recurring names; Tornar Não pode faltar moves one', async ({
  page,
}) => {
  await usedNotRecurring(page)
  await expect(recurringList(page).getByRole('listitem')).toHaveCount(0)
  await expect(others(page)).toBeHidden()
  await makeRecurring(page)
  await expect(
    recurringList(page).getByRole('listitem').filter({ hasText: 'feijão' }),
  ).toBeVisible()
  await expect(others(page).getByRole('listitem')).toHaveCount(0)
})

test('S-074 AC4: "Outros itens já usados" opens and closes', async ({ page }) => {
  await usedNotRecurring(page)
  const header = page.getByRole('button', { name: new RegExp(strings.pantry.othersTitle) })
  await expect(header).toHaveAttribute('aria-expanded', 'false')
  await header.click()
  await expect(header).toHaveAttribute('aria-expanded', 'true')
  await expect(others(page).getByRole('listitem').filter({ hasText: 'feijão' })).toBeVisible()
  const rowBox = others(page).getByRole('listitem').first()
  expect(
    await rowBox.evaluate((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius)),
  ).toBeGreaterThanOrEqual(16)
  expect(await rowBox.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(
    'rgba(0, 0, 0, 0)',
  )
  await header.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  expect(await header.evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('solid')
  expect(await header.evaluate((e) => getComputedStyle(e).outlineWidth)).toBe('3px')
  await header.click()
  await expect(others(page)).toBeHidden()
})

test('S-025 AC2: Remover de Não pode faltar drops it; pending item stays with recurring off', async ({
  page,
}) => {
  await usedNotRecurring(page)
  await makeRecurring(page)
  await recurringList(page)
    .getByRole('listitem')
    .filter({ hasText: 'feijão' })
    .getByRole('button', { name: strings.pantry.removeRecurring })
    .click()
  await expect(recurringList(page).getByRole('listitem')).toHaveCount(0)
  await page.getByRole('link', { name: strings.nav.list, exact: true }).click()
  await expect(listRow(page, 'feijão')).toBeVisible()
  await page.getByRole('button', { name: strings.list.edit('feijão') }).click()
  await expect(page.getByLabel(strings.item.recurring)).not.toBeChecked()
})

test('S-025 AC3: a recurring made by one member shows in the other member Despensa', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, ['feijão'])
  await beto.goto('/despensa')
  await expect(recurringList(beto).getByRole('listitem')).toHaveCount(0)

  await ana.goto('/entrar')
  await openPantry(ana)
  await makeRecurring(ana)
  await expect(
    recurringList(beto).getByRole('listitem').filter({ hasText: 'feijão' }),
  ).toBeVisible()
})

test('S-025 AC4: offline make/remove recurring reflects at once and persists after reconnect', async ({
  page,
  context,
}) => {
  await usedNotRecurring(page)
  await context.setOffline(true)
  await makeRecurring(page)
  await expect(
    recurringList(page).getByRole('listitem').filter({ hasText: 'feijão' }),
  ).toBeVisible()
  await context.setOffline(false)
  await page.reload()
  await expect(
    recurringList(page).getByRole('listitem').filter({ hasText: 'feijão' }),
  ).toBeVisible()
  await context.setOffline(true)
  await recurringList(page)
    .getByRole('listitem')
    .filter({ hasText: 'feijão' })
    .getByRole('button', { name: strings.pantry.removeRecurring })
    .click()
  await expect(recurringList(page).getByRole('listitem')).toHaveCount(0)
  await context.setOffline(false)
  await page.reload()
  await expect(recurringList(page).getByRole('listitem')).toHaveCount(0)
})

test('S-061 AC5: "Entenda melhor" opens the dialog; Esc and Entendi close it', async ({ page }) => {
  await signUpWithFamily(page)
  await openPantry(page)
  const dialog = page.getByRole('dialog', { name: strings.pantry.helpTitle })
  await page.getByRole('button', { name: strings.pantry.learnMore }).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: strings.pantry.learnMore }).click()
  await page.getByRole('button', { name: strings.pantry.helpClose }).click()
  await expect(dialog).toBeHidden()
})

test('S-094 AC7: Despensa groups by category in order; collapsing persists after reload', async ({
  page,
}) => {
  await signUpWithFamily(page)
  await page.goto('/categorias')
  await page
    .getByRole('button', { name: strings.categories.suggestionChip('Mercearia'), exact: true })
    .click()
  await expect(page.getByRole('list', { name: strings.categories.userList })).toBeVisible()
  await page.goto('/entrar')
  for (const name of ['feijão', 'pilha']) {
    await field(page).fill(name)
    await field(page).press('Enter')
    await expect(listRow(page, name)).toBeVisible()
  }
  await page.getByRole('button', { name: strings.list.edit('feijão') }).click()
  await page.getByRole('combobox', { name: strings.item.category }).selectOption('Mercearia')
  await page.getByLabel(strings.item.recurring).check()
  await page.getByRole('button', { name: strings.item.save }).click()
  await page.getByRole('button', { name: strings.list.edit('pilha') }).click()
  await page.getByLabel(strings.item.recurring).check()
  await page.getByRole('button', { name: strings.item.save }).click()
  await openPantry(page)
  const headers = page.getByRole('heading', { level: 2 })
  await expect(headers).toHaveText([/Mercearia/, new RegExp(strings.noCategory)])
  const merc = page.getByRole('button', { name: /Mercearia/ })
  await expect(merc).toHaveAttribute('aria-expanded', 'true')
  await merc.click()
  await expect(pantryRow(page, 'feijão')).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('button', { name: /Mercearia/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(pantryRow(page, 'feijão')).toHaveCount(0)
  await expect(pantryRow(page, 'pilha')).toBeVisible()
})

test('S-117 AC3: "Marcar todos como faltando" adds the items at home to the list', async ({
  page,
}) => {
  await recurringAtHome(page)
  await expect(listRow(page, 'feijão')).toContainText(strings.pantry.atHome)
  await page.getByRole('button', { name: strings.pantry.markAllMissing }).click()
  await expect(listRow(page, 'feijão')).toContainText(strings.pantry.missing)
  await expect(page.getByRole('button', { name: strings.pantry.markAllMissing })).toHaveCount(0)
  await page.getByRole('link', { name: strings.nav.list, exact: true }).click()
  await expect(listRow(page, 'feijão')).toContainText('3 kg')
})
