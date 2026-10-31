import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

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
  await page.getByRole('button', { name: strings.family.continue }).click()
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

test('S-019 AC3: toggling the checkbox moves an item to Comprados and back', async ({ page }) => {
  await setupFamily(page)
  await field(page).fill('arroz')
  await field(page).press('Enter')
  await expect(row(page, 'arroz')).toBeVisible()

  await page.getByRole('checkbox', { name: strings.list.markBought('arroz') }).click()
  const bought = page.getByRole('region', { name: strings.list.boughtTitle })
  await expect(bought.getByRole('listitem').filter({ hasText: 'arroz' })).toBeVisible()
  await expect(bought.getByText('arroz')).toHaveCSS('text-decoration-line', 'line-through')

  await page.getByRole('checkbox', { name: strings.list.markPending('arroz') }).click()
  const pending = page.getByRole('region', { name: strings.list.pendingTitle })
  await expect(pending.getByRole('listitem').filter({ hasText: 'arroz' })).toBeVisible()
  await expect(bought.getByRole('listitem')).toHaveCount(0)
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
  await page.getByRole('link', { name: strings.family.title }).click()
  await expect(page).toHaveURL(/\/familia$/)
})
