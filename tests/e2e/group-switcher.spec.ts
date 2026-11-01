import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators, waitForItemCount } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const PASSWORD = 'secret123'

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    baseURL: 'http://127.0.0.1:4173',
  })
  return context.newPage()
}

async function signUpWithGroup(page: Page, email: string, group: string): Promise<string> {
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill(email)
  await page.getByLabel(strings.login.password).fill(PASSWORD)
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill(group)
  await page.getByRole('button', { name: strings.family.create }).click()
  const code = (await page.getByTestId('invite-code').textContent()) ?? ''
  await page.getByRole('link', { name: strings.nav.list, exact: true }).click()
  return code
}

async function addRecurring(page: Page, name: string) {
  await page.getByLabel(strings.list.addLabel).fill(name)
  await page.getByLabel(strings.list.addLabel).press('Enter')
  await page.getByRole('button', { name: strings.list.edit(name) }).click()
  await page.getByLabel(strings.item.recurring).check()
  await page.getByRole('button', { name: strings.item.save }).click()
  await expect(page.getByRole('checkbox', { name: new RegExp(name) })).toBeVisible()
}

const tab = (page: Page, name: string) => page.getByRole('link', { name, exact: true })

test('S-090 AC1/AC3: title opens the group sheet, even with a single group', async ({ page }) => {
  await signUpWithGroup(page, 'ana@example.com', 'Casa')
  await page.getByRole('button', { name: strings.groups.switchLabel }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('button', { name: 'Casa' })).toHaveAttribute('aria-current', 'true')
  await expect(sheet.getByRole('button', { name: strings.groups.createNew })).toBeVisible()
  await expect(sheet.getByRole('button', { name: strings.groups.joinWithCode })).toBeVisible()
  await sheet.getByRole('button', { name: strings.groups.createNew }).click()
  await expect(page).toHaveURL(/\/grupo$/)
})

test('S-090 AC2/AC5: switching groups changes Lista, Despensa and Histórico; survives reload', async ({
  page,
  browser,
}) => {
  await signUpWithGroup(page, 'ana@example.com', 'Casa')
  await addRecurring(page, 'arroz')
  await page.getByRole('checkbox', { name: /arroz/ }).click()
  await expect(page.getByRole('checkbox', { name: /arroz/ })).toBeChecked()
  await page.getByRole('link', { name: strings.checkout.link }).click()
  await page.getByLabel(strings.checkout.priceFor('arroz')).fill('5,00')
  await page.getByLabel(strings.checkout.marketLabel).fill('Atacadão')
  await page.getByRole('button', { name: strings.checkout.finish, exact: true }).click()
  await expect(page).toHaveURL(/\/$/)

  const b = await newPage(browser)
  const code = await signUpWithGroup(b, 'beto@example.com', 'Outra')
  await addRecurring(b, 'feijão')
  await waitForItemCount(1)

  await page.goto(`/convite/${code}`)
  await page.getByRole('button', { name: strings.invite.confirm }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Outra' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /feijão/ })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /arroz/ })).toHaveCount(0)
  await tab(page, strings.pantry.link).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'feijão' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'arroz' })).toHaveCount(0)
  await tab(page, strings.history.link).click()
  await expect(page.getByText(strings.history.empty)).toBeVisible()

  await tab(page, strings.nav.list).click()
  await page.getByRole('button', { name: strings.groups.switchLabel }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Casa' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /feijão/ })).toHaveCount(0)
  await tab(page, strings.pantry.link).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'arroz' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'feijão' })).toHaveCount(0)
  await tab(page, strings.history.link).click()
  await expect(
    page.getByRole('list', { name: strings.history.monthsLabel }).getByRole('link'),
  ).toHaveCount(1)

  await page.reload()
  await tab(page, strings.nav.list).click()
  await expect(page.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await b.context().close()
})

test('S-090 AC4: /familia redirects to /grupo', async ({ page }) => {
  await signUpWithGroup(page, 'ana@example.com', 'Casa')
  await page.goto('/familia')
  await expect(page).toHaveURL(/\/grupo$/)
})
