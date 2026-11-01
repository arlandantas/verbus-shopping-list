import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { setItemCategory } from './support/categorize'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const PASSWORD = 'secret123'
const BASE_URL = 'http://127.0.0.1:4173'

async function signUp(page: Page, email: string) {
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill(email)
  await page.getByLabel(strings.login.password).fill(PASSWORD)
  await page.getByRole('button', { name: strings.login.signUp }).click()
}

async function setupFamily(page: Page): Promise<string> {
  await signUp(page, 'ana@example.com')
  await expect(page).toHaveURL(/\/familia$/)
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await expect(page.getByTestId('invite-code')).toBeVisible()
  const code = (await page.getByTestId('invite-code').textContent()) ?? ''
  await page
    .getByRole('navigation', { name: strings.nav.label })
    .getByRole('link', { name: strings.nav.list, exact: true })
    .click()
  await expect(page).toHaveURL(/\/$/)
  return code
}

const field = (page: Page) => page.getByLabel(strings.list.addLabel)
const row = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })

test('S-019 AC1: "3 kg feijão" + Enter shows the item at once; field clears and keeps focus', async ({
  page,
}) => {
  await setupFamily(page)
  await field(page).fill('3 kg feijão')
  await field(page).press('Enter')
  await expect(row(page, 'feijão')).toContainText('3 kg')
  await expect(field(page)).toHaveValue('')
  await expect(field(page)).toBeFocused()
})

test('S-019 AC2: empty or blank input adds nothing and the button is disabled', async ({
  page,
}) => {
  await setupFamily(page)
  const add = page.getByRole('button', { name: strings.list.add, exact: true })
  await expect(add).toBeDisabled()
  await field(page).fill('   ')
  await expect(add).toBeDisabled()
  await field(page).press('Enter')
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await expect(page.getByText(strings.list.empty)).toBeVisible()
})

test('S-019 AC3: toggling the checkbox checks an item (struck through) and back', async ({
  page,
}) => {
  await setupFamily(page)
  await field(page).fill('arroz')
  await field(page).press('Enter')
  await expect(row(page, 'arroz')).toBeVisible()

  await page.getByRole('checkbox', { name: 'arroz' }).click()
  const label = row(page, 'arroz').getByText('arroz')
  await expect(page.getByRole('checkbox', { name: 'arroz' })).toBeChecked()
  await expect(label).toHaveCSS('text-decoration-line', 'line-through')

  await page.getByRole('checkbox', { name: 'arroz' }).click()
  await expect(page.getByRole('checkbox', { name: 'arroz' })).not.toBeChecked()
  await expect(label).not.toHaveCSS('text-decoration-line', 'line-through')
})

test('S-019 AC4: offline add shows at once with sync indicator; reconnect clears it and it persists', async ({
  page,
  context,
}) => {
  await setupFamily(page)
  await context.setOffline(true)
  await field(page).fill('leite')
  await field(page).press('Enter')
  await expect(row(page, 'leite')).toBeVisible()
  await expect(row(page, 'leite').getByText(strings.list.pendingSync)).toBeVisible()

  await context.setOffline(false)
  await expect(row(page, 'leite').getByText(strings.list.pendingSync)).toHaveCount(0)
  await page.reload()
  await expect(row(page, 'leite')).toBeVisible()
})

test('S-019 AC5: an item added by one member appears for the other', async ({ page, browser }) => {
  const code = await setupFamily(page)
  const ctx = await (browser as Browser).newContext({ ...devices['Pixel 7'], baseURL: BASE_URL })
  const b = await ctx.newPage()
  await signUp(b, 'beto@example.com')
  await expect(b).toHaveURL(/\/familia$/)
  await b.getByLabel(strings.family.join.codeLabel).fill(code)
  await b.getByRole('button', { name: strings.family.join.submit }).click()
  await expect(b.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await b.goto('/')
  await expect(field(b)).toBeVisible()

  await field(page).fill('café')
  await field(page).press('Enter')
  await expect(row(b, 'café')).toBeVisible()
  await ctx.close()
})

test('S-019 AC6: empty list shows a pt-BR message; header has family name and /familia link', async ({
  page,
}) => {
  await setupFamily(page)
  await expect(page.getByText(strings.list.empty)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await page.getByRole('link', { name: strings.family.title, exact: true }).click()
  await expect(page).toHaveURL(/\/familia$/)
})

const headings = (page: Page) => page.locator('h2 > button > span:first-child').allTextContents()

test('S-044 AC2: the list groups Mercearia, Laticínios, Sem categoria', async ({ page }) => {
  await setupFamily(page)
  for (const name of ['pilha', 'leite', 'arroz']) {
    await field(page).fill(name)
    await field(page).press('Enter')
    await expect(row(page, name)).toBeVisible()
  }
  await setItemCategory(page, 'leite', 'Laticínios')
  await setItemCategory(page, 'arroz', 'Mercearia')
  const expected = ['Mercearia', 'Laticínios', 'Sem categoria']
  await expect.poll(() => headings(page)).toEqual(expected)
  await expect(
    page.getByRole('region', { name: 'Laticínios' }).getByRole('listitem'),
  ).toContainText(['leite'])
  await expect(
    page.getByRole('region', { name: 'Sem categoria' }).getByRole('listitem'),
  ).toContainText(['pilha'])
})

test('S-044 AC4: deleting a category moves its items to Sem categoria without reload', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, ['pilha'])
  const t = strings.categories
  await ana.goto('/categorias')
  await ana.getByRole('button', { name: t.newLabel }).click()
  await ana.getByLabel(t.nameLabel).fill('Pets')
  await ana.getByRole('button', { name: t.save }).click()
  await expect(ana.getByRole('listitem').filter({ hasText: 'Pets' })).toBeVisible()
  await ana.goto('/')
  await setItemCategory(ana, 'pilha', 'Pets')
  await expect(beto.getByRole('region', { name: 'Pets' })).toContainText('pilha')

  await ana.goto('/categorias')
  await ana.getByRole('button', { name: t.deleteFor('Pets') }).click()
  await ana.getByRole('button', { name: t.confirm }).click()
  await expect(beto.getByRole('region', { name: 'Pets' })).toHaveCount(0)
  await expect(beto.getByRole('region', { name: 'Sem categoria' })).toContainText('pilha')
})

test('S-060 AC3/AC5: field sits in the lower half above the tabs; last item is not covered', async ({
  page,
}) => {
  await setupFamily(page)
  for (let i = 1; i <= 14; i++) {
    await field(page).fill(`item${String(i).padStart(2, '0')}`)
    await field(page).press('Enter')
  }
  const box = (await field(page).boundingBox())!
  const nav = (await page.getByRole('navigation', { name: strings.nav.label }).boundingBox())!
  const viewport = page.viewportSize()!
  expect(box.y).toBeGreaterThan(viewport.height / 2)
  expect(box.y + box.height).toBeLessThanOrEqual(nav.y + 1)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('checkbox', { name: 'item14' }).click()
  await expect(page.getByRole('checkbox', { name: 'item14' })).toBeChecked()
})
