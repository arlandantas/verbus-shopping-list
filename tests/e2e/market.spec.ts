import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { setItemCategory } from './support/categorize'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

async function setup(page: Page, items: string[]) {
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await expect(page).toHaveURL(/\/familia$/)
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await expect(page.getByTestId('invite-code')).toBeVisible()
  await page.getByRole('button', { name: strings.family.continue }).click()
  await expect(page).toHaveURL(/\/$/)
  const field = page.getByLabel(strings.list.addLabel)
  for (const name of items) {
    await field.fill(name)
    await field.press('Enter')
    await expect(page.getByRole('listitem').filter({ hasText: name })).toBeVisible()
  }
}

const box = (page: Page, name: RegExp | string) => page.getByRole('checkbox', { name })
const names = (page: Page) => page.getByRole('listitem').getByRole('checkbox')

test('S-028 AC2: /mercado leads to the list', async ({ page }) => {
  await setup(page, ['arroz'])
  await page.goto('/mercado')
  await expect(page).toHaveURL(/\/$/)
  await expect(box(page, 'arroz')).toBeVisible()
})

test('S-028 AC3: tapping a row checks it to the end; tapping again restores its position', async ({
  page,
}) => {
  await setup(page, ['arroz', 'feijão', 'leite'])
  const arroz = box(page, /arroz/)
  await expect(arroz).not.toBeChecked()
  await page.getByRole('listitem').filter({ hasText: 'arroz' }).getByText('arroz').click()
  await expect(arroz).toBeChecked()
  await expect(
    page.getByRole('listitem').filter({ hasText: 'arroz' }).getByText('arroz'),
  ).toHaveCSS('text-decoration-line', 'line-through')
  await expect(names(page).last()).toHaveAccessibleName('arroz')
  await arroz.click()
  await expect(arroz).not.toBeChecked()
  await expect(names(page).first()).toHaveAccessibleName('arroz')
})

test('S-028 AC4: rows at least 56px tall and marking needs no typing', async ({ page }) => {
  await setup(page, ['arroz', 'feijão'])
  const rows = page.getByRole('listitem')
  await expect(rows).toHaveCount(2)
  for (const r of await rows.all()) {
    const b = await r.boundingBox()
    expect(b!.height).toBeGreaterThanOrEqual(56)
  }
  await box(page, /arroz/).click()
  await expect(box(page, /arroz/)).toBeChecked()
})

test('S-028 AC5: counter follows the marks; all checked shows the complete message', async ({
  page,
}) => {
  await setup(page, ['arroz', 'feijão'])
  await expect(page.getByText(strings.market.counter(0, 2))).toBeVisible()
  await box(page, /arroz/).click()
  await expect(page.getByText(strings.market.counter(1, 2))).toBeVisible()
  await box(page, /feijão/).click()
  await expect(page.getByText(strings.market.counter(2, 2))).toBeVisible()
  await expect(page.getByText(strings.market.allDone)).toBeVisible()
})

test('S-029 AC2: Beto sees "por Ana" in the list; Ana sees "por você"', async ({ browser }) => {
  const { ana, beto } = await twoMembers(browser, ['leite'])
  await box(ana, /leite/).click()
  await expect(ana.getByText(strings.markedBy.you)).toBeVisible()
  await expect(beto.getByText(strings.markedBy.by('Ana'))).toBeVisible()
})

test('S-029 AC3: undoing removes the "por ..." label', async ({ browser }) => {
  const { ana, beto } = await twoMembers(browser, ['leite'])
  const leite = box(ana, /leite/)
  await leite.click()
  await expect(ana.getByText(strings.markedBy.you)).toBeVisible()
  await expect(beto.getByText(strings.markedBy.by('Ana'))).toBeVisible()
  await leite.click()
  await expect(ana.getByText(/^por /)).toHaveCount(0)
  await expect(beto.getByText(/^por /)).toHaveCount(0)
})

test('S-044 AC3: checking arroz moves it to the end of its own section; undo restores it', async ({
  page,
}) => {
  await setup(page, ['arroz', 'feijão', 'leite'])
  await setItemCategory(page, 'arroz', 'Mercearia')
  await setItemCategory(page, 'feijão', 'Mercearia')
  await setItemCategory(page, 'leite', 'Laticínios')
  const mercearia = page.getByRole('region', { name: 'Mercearia' }).getByRole('checkbox')
  await expect(mercearia.first()).toHaveAccessibleName('arroz')
  await box(page, /arroz/).click()
  await expect(mercearia.last()).toHaveAccessibleName('arroz')
  await expect(mercearia.first()).toHaveAccessibleName('feijão')
  await expect(page.getByRole('region', { name: 'Laticínios' }).getByRole('checkbox')).toHaveCount(
    1,
  )
  await box(page, /arroz/).click()
  await expect(mercearia.first()).toHaveAccessibleName('arroz')
})

test('S-045 AC4: the value is entered only through the sheet, never in the row', async ({
  page,
}) => {
  await setup(page, ['arroz'])
  await box(page, /arroz/).click()
  await expect(box(page, /arroz/)).toBeChecked()
  await expect(page.getByLabel(strings.item.price)).toHaveCount(0)
  await page.getByRole('button', { name: strings.list.edit('arroz') }).click()
  await expect(page.getByLabel(strings.item.price)).toBeVisible()
})

const hide = (page: Page) => page.getByRole('switch', { name: strings.market.hideInCart })

const toggleHide = (page: Page) => page.getByText(strings.market.hideInCart).click()

test('S-059 AC5: hide bought items shows the count, can be undone and survives reload', async ({
  page,
}) => {
  await setup(page, ['arroz', 'feijão', 'macarrão'])
  for (const n of ['arroz', 'feijão', 'macarrão']) await setItemCategory(page, n, 'Mercearia')
  await box(page, /arroz/).click()
  await box(page, /feijão/).click()
  await toggleHide(page)
  await expect(page.getByText(strings.market.hiddenCount(2))).toBeVisible()
  await expect(box(page, /arroz/)).toHaveCount(0)
  await expect(box(page, /feijão/)).toHaveCount(0)
  await expect(box(page, /macarrão/)).toBeVisible()
  await page.reload()
  await expect(hide(page)).toBeChecked()
  await expect(page.getByText(strings.market.hiddenCount(2))).toBeVisible()
  await toggleHide(page)
  await expect(box(page, /arroz/)).toBeVisible()
  await expect(page.getByText(strings.market.hiddenCount(2))).toHaveCount(0)
})

test('S-059 AC6: collapsing a category hides its rows and persists after reload', async ({
  page,
}) => {
  await setup(page, ['arroz', 'leite'])
  await setItemCategory(page, 'arroz', 'Mercearia')
  await setItemCategory(page, 'leite', 'Laticínios')
  const lat = page.getByRole('button', { name: /Laticínios/ })
  await lat.click()
  await expect(lat).toHaveAttribute('aria-expanded', 'false')
  await expect(box(page, /leite/)).toHaveCount(0)
  await expect(box(page, /arroz/)).toBeVisible()
  await page.reload()
  await expect(lat).toHaveAttribute('aria-expanded', 'false')
  await expect(box(page, /leite/)).toHaveCount(0)
})
