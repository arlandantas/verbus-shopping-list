import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

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

const AUTH_KEY = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake'
async function newMember(browser: Browser, email: string, displayName: string): Promise<Page> {
  const res = await fetch(AUTH_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret123', displayName, returnSecureToken: true }),
  })
  if (!res.ok) throw new Error(`signUp failed: ${res.status}`)
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    baseURL: 'http://127.0.0.1:4173',
  })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill(email)
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signIn, exact: true }).click()
  return page
}

async function twoMembers(browser: Browser) {
  const ana = await newMember(browser, 'ana@example.com', 'Ana')
  await expect(ana).toHaveURL(/\/familia$/)
  await ana.getByLabel(strings.family.nameLabel).fill('Casa')
  await ana.getByRole('button', { name: strings.family.create }).click()
  const code = (await ana.getByTestId('invite-code').textContent()) ?? ''
  await ana.getByRole('button', { name: strings.family.continue }).click()
  const field = ana.getByLabel(strings.list.addLabel)
  await field.fill('leite')
  await field.press('Enter')
  await expect(ana.getByRole('listitem').filter({ hasText: 'leite' })).toBeVisible()
  await ana.waitForTimeout(1500) // let the item write reach the emulator
  // Reload so the member profile is (re)published: on the create-family first load the lazy write can be denied (see report).
  await ana.reload()
  await expect(ana.getByRole('listitem').filter({ hasText: 'leite' })).toBeVisible()
  await ana.waitForTimeout(1500)
  const beto = await newMember(browser, 'beto@example.com', 'Beto')
  await expect(beto).toHaveURL(/\/familia$/)
  await beto.getByLabel(strings.family.join.codeLabel).fill(code)
  await beto.getByRole('button', { name: strings.family.join.submit }).click()
  await expect(beto.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await beto.goto('/')
  await expect(beto.getByLabel(strings.list.addLabel)).toBeVisible()
  return { ana, beto }
}

test('S-029 AC2: Beto sees "por Ana" in market and list; Ana sees "por você"', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser)
  await ana.getByRole('link', { name: strings.market.enter }).click()
  await ana.getByRole('button', { name: /leite/ }).click()
  await expect(ana.getByText(strings.markedBy.you)).toBeVisible()
  await beto.getByRole('link', { name: strings.market.enter }).click()
  await expect(beto.getByText(strings.markedBy.by('Ana'))).toBeVisible()
  await beto.getByRole('link', { name: strings.market.exit }).click()
  await expect(beto.getByText(strings.markedBy.by('Ana'))).toBeVisible()
  await ana.getByRole('link', { name: strings.market.exit }).click()
  await expect(ana.getByText(strings.markedBy.you)).toBeVisible()
})

test('S-029 AC3: undoing removes the "por ..." label', async ({ browser }) => {
  const { ana, beto } = await twoMembers(browser)
  await ana.getByRole('link', { name: strings.market.enter }).click()
  const leite = ana.getByRole('button', { name: /leite/ })
  await leite.click()
  await expect(ana.getByText(strings.markedBy.you)).toBeVisible()
  await beto.getByRole('link', { name: strings.market.enter }).click()
  await expect(beto.getByText(strings.markedBy.by('Ana'))).toBeVisible()
  await leite.click()
  await expect(ana.getByText(/^por /)).toHaveCount(0)
  await expect(beto.getByText(/^por /)).toHaveCount(0)
})
