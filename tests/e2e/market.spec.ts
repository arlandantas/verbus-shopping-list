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

const goMarket = async (page: Page) => {
  await page.getByRole('link', { name: strings.market.enter }).click()
  await expect(page).toHaveURL(/\/mercado$/)
}
const names = (page: Page) => page.getByRole('listitem').locator('button')

test('S-028 AC2: "Ir ao mercado" opens /mercado and "Sair" returns to /', async ({ page }) => {
  await setup(page, ['arroz'])
  await goMarket(page)
  await page.getByRole('link', { name: strings.market.exit }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('S-028 AC3: tapping a row checks it to the end; tapping again restores its position', async ({
  page,
}) => {
  await setup(page, ['arroz', 'feijão', 'leite'])
  await goMarket(page)
  const arroz = page.getByRole('button', { name: /arroz/ })
  await expect(arroz).toHaveAttribute('aria-pressed', 'false')
  await arroz.click()
  await expect(arroz).toHaveAttribute('aria-pressed', 'true')
  await expect(arroz.getByText('arroz')).toHaveCSS('text-decoration-line', 'line-through')
  await expect(names(page).last()).toContainText('arroz')
  await arroz.click()
  await expect(arroz).toHaveAttribute('aria-pressed', 'false')
  await expect(names(page).first()).toContainText('arroz')
})

test('S-028 AC4: no text field, no detail link, rows at least 64px tall', async ({ page }) => {
  await setup(page, ['arroz', 'feijão'])
  await goMarket(page)
  await expect(names(page)).toHaveCount(2)
  await expect(page.locator('input, textarea')).toHaveCount(0)
  await expect(page.locator('a[href^="/item"]')).toHaveCount(0)
  for (const b of await names(page).all()) {
    const box = await b.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(64)
  }
})

test('S-028 AC5: counter follows the marks; all checked shows the complete message', async ({
  page,
}) => {
  await setup(page, ['arroz', 'feijão'])
  await goMarket(page)
  await expect(page.getByText(strings.market.counter(0, 2))).toBeVisible()
  await page.getByRole('button', { name: /arroz/ }).click()
  await expect(page.getByText(strings.market.counter(1, 2))).toBeVisible()
  await page.getByRole('button', { name: /feijão/ }).click()
  await expect(page.getByText(strings.market.counter(2, 2))).toBeVisible()
  await expect(page.getByText(strings.market.allDone)).toBeVisible()
})

test('S-029 AC2: Beto sees "por Ana" in market and list; Ana sees "por você"', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, ['leite'])
  await ana.getByRole('button', { name: /leite/ }).click()
  await expect(ana.getByText(strings.markedBy.you)).toBeVisible()
  await expect(beto.getByText(strings.markedBy.by('Ana'))).toBeVisible()
  await beto.getByRole('link', { name: strings.market.exit }).click()
  await expect(beto.getByText(strings.markedBy.by('Ana'))).toBeVisible()
  await ana.getByRole('link', { name: strings.market.exit }).click()
  await expect(ana.getByText(strings.markedBy.you)).toBeVisible()
})

test('S-029 AC3: undoing removes the "por ..." label', async ({ browser }) => {
  const { ana, beto } = await twoMembers(browser, ['leite'])
  const leite = ana.getByRole('button', { name: /leite/ })
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
  await goMarket(page)
  const mercearia = page.getByRole('region', { name: 'Mercearia' }).getByRole('button')
  await expect(mercearia.first()).toContainText('arroz')
  await page.getByRole('button', { name: /arroz/ }).click()
  await expect(mercearia.last()).toContainText('arroz')
  await expect(mercearia.first()).toContainText('feijão')
  await expect(page.getByRole('region', { name: 'Laticínios' }).getByRole('button')).toHaveCount(1)
  await page.getByRole('button', { name: /arroz/ }).click()
  await expect(mercearia.first()).toContainText('arroz')
})
