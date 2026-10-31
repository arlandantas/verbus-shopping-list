import { devices, expect, test, type Page } from '@playwright/test'
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
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await page.getByRole('button', { name: strings.family.continue }).click()
  await expect(page).toHaveURL(/\/$/)
}

/** Adds "3 kg feijão" and marks it recurring in the detail screen. */
async function addRecurring(page: Page) {
  await field(page).fill('3 kg feijão')
  await field(page).press('Enter')
  await expect(listRow(page, 'feijão')).toBeVisible()
  await page.getByRole('link', { name: 'feijão' }).click()
  await page.getByLabel(strings.item.recurring).check()
  await page.getByRole('button', { name: strings.item.save }).click()
  await expect(page).toHaveURL(/\/$/)
}

const openPantry = async (page: Page) => {
  await page.getByRole('link', { name: strings.pantry.link }).click()
  await expect(page).toHaveURL(/\/despensa$/)
}

/** Recurring "feijão" with no item on the list (deleted; catalog keeps the mark). */
async function recurringAtHome(page: Page) {
  await signUpWithFamily(page)
  await addRecurring(page)
  await page.getByRole('link', { name: 'feijão' }).click()
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
  await row.getByRole('button').first().click()
  await expect(row).toContainText(strings.pantry.missing)
  await page.getByRole('link', { name: strings.pantry.back }).click()
  await expect(listRow(page, 'feijão')).toContainText('3 kg')
  await expect(page.getByRole('region', { name: strings.list.pendingTitle })).toContainText(
    'feijão',
  )
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
  await page.getByRole('link', { name: strings.pantry.back }).click()
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('S-024 AC4: bought recurring shows No carrinho and is not tappable', async ({ page }) => {
  await signUpWithFamily(page)
  await addRecurring(page)
  await page.getByRole('checkbox', { name: strings.list.markBought('feijão') }).click()
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

test('S-025 AC1: "Outros itens já usados" lists non-recurring names; Tornar recorrente moves one', async ({
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

test('S-025 AC2: Remover dos recorrentes drops it; pending item stays with recurring off', async ({
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
  await page.getByRole('link', { name: strings.pantry.back }).click()
  await expect(listRow(page, 'feijão')).toBeVisible()
  await page.getByRole('link', { name: 'feijão' }).click()
  await expect(page.getByLabel(strings.item.recurring)).not.toBeChecked()
})

test('S-025 AC3: a recurring made by one member shows in the other member Despensa', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, ['feijão'])
  await beto.goto('/despensa')
  await expect(recurringList(beto).getByRole('listitem')).toHaveCount(0)

  await ana.goto('/')
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
