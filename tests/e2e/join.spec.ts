import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const PASSWORD = 'secret123'
const BASE_URL = 'http://127.0.0.1:4173'

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: BASE_URL })
  return context.newPage()
}

async function signUp(page: Page, email: string) {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill(email)
  await page.getByLabel(strings.login.password).fill(PASSWORD)
  await page.getByRole('button', { name: strings.login.signUp }).click()
}

async function createFamily(page: Page, name: string): Promise<string> {
  await expect(page).toHaveURL(/\/grupo$/)
  await page.getByLabel(strings.family.nameLabel).fill(name)
  await page.getByRole('button', { name: strings.family.create }).click()
  await expect(page.getByTestId('invite-code')).toBeVisible()
  return (await page.getByTestId('invite-code').textContent()) ?? ''
}

test('S-012 AC1: B joins by typing the code and A sees B in real time', async ({
  page,
  browser,
}) => {
  await signUp(page, 'ana@example.com')
  const code = await createFamily(page, 'Casa')
  await expect(page.getByText(strings.family.members(1))).toBeVisible()

  const b = await newPage(browser)
  await signUp(b, 'beto@example.com')
  await expect(b).toHaveURL(/\/grupo$/)
  await b
    .getByLabel(strings.family.join.codeLabel)
    .fill(`${code.slice(0, 4).toLowerCase()}-${code.slice(4)}`)
  await b.getByRole('button', { name: strings.family.join.submit }).click()
  await expect(b.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await expect(b.getByText(strings.family.members(2))).toBeVisible()

  await expect(page.getByText(strings.family.members(2))).toBeVisible()
  await b.context().close()
})

test('S-012 AC2: signed-out B opens the invite, logs in, returns, confirms and joins', async ({
  page,
  browser,
}) => {
  await signUp(page, 'ana@example.com')
  const code = await createFamily(page, 'Casa')

  const b = await newPage(browser)
  await b.goto(`/convite/${code}`)
  await expect(b).toHaveURL(/\/entrar$/)
  await b.getByLabel(strings.login.email).fill('beto@example.com')
  await b.getByLabel(strings.login.password).fill(PASSWORD)
  await b.getByRole('button', { name: strings.login.signUp }).click()

  await expect(b).toHaveURL(new RegExp(`/convite/${code}$`))
  await expect(b.getByRole('heading', { name: strings.invite.title('Casa') })).toBeVisible()
  await b.getByRole('button', { name: strings.invite.confirm }).click()
  await expect(b).toHaveURL(/\/$/)
  await expect(b.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await b.context().close()
})

test('S-012 AC3: unknown code shows "Convite não encontrado" and changes nothing', async ({
  page,
}) => {
  await signUp(page, 'beto@example.com')
  await expect(page).toHaveURL(/\/grupo$/)
  await page.goto('/convite/ZZZZ2222')
  await expect(page.getByText(strings.invite.notFound)).toBeVisible()
  await expect(page.getByRole('button', { name: strings.invite.confirm })).toHaveCount(0)

  await page.goto('/entrar')
  await expect(page).toHaveURL(/\/grupo$/)
  await expect(page.getByLabel(strings.family.nameLabel)).toBeVisible()
})

test('S-089: a member of group A opens the invite for group B, previews, confirms and B becomes active', async ({
  page,
  browser,
}) => {
  await signUp(page, 'ana@example.com')
  await createFamily(page, 'Casa')

  const b = await newPage(browser)
  await signUp(b, 'beto@example.com')
  const otherCode = await createFamily(b, 'Outra')

  await page.goto(`/convite/${otherCode}`)
  await expect(page.getByRole('heading', { name: strings.invite.title('Outra') })).toBeVisible()
  await page.getByRole('button', { name: strings.invite.confirm }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/grupo')
  await expect(page.getByRole('heading', { name: 'Outra' })).toBeVisible()
  await expect(page.getByText(strings.family.members(2))).toBeVisible()
  await b.context().close()
})

test('S-077 AC5: rotating the code shows a new one and the old one stops working', async ({
  page,
  browser,
}) => {
  await signUp(page, 'ana@example.com')
  const oldCode = await createFamily(page, 'Casa')
  await page.getByRole('button', { name: strings.family.invite.rotate }).click()
  await page.getByRole('button', { name: strings.family.invite.rotateConfirm }).click()
  await expect(page.getByTestId('invite-code')).not.toHaveText(oldCode)
  const newCode = (await page.getByTestId('invite-code').textContent()) ?? ''
  expect(newCode).toMatch(/^[2-9A-HJKMNP-Z]{8}$/)

  const b = await newPage(browser)
  await signUp(b, 'beto@example.com')
  await expect(b).toHaveURL(/\/grupo$/)
  await b.goto(`/convite/${oldCode}`)
  await expect(b.getByText(strings.invite.notFound)).toBeVisible()
  await b.goto(`/convite/${newCode}`)
  await expect(b.getByRole('button', { name: strings.invite.confirm })).toBeVisible()
  await b.context().close()
})

test('S-091 AC6: A joins B by link, B is active, back to A via the switcher, items stay isolated', async ({
  page,
  browser,
}) => {
  await signUp(page, 'ana@example.com')
  await createFamily(page, 'Casa')
  await page.getByRole('link', { name: strings.nav.list, exact: true }).click()
  await page.getByLabel(strings.list.addLabel).fill('arroz')
  await page.getByLabel(strings.list.addLabel).press('Enter')
  await expect(page.getByRole('checkbox', { name: /arroz/ })).toBeVisible()

  const b = await newPage(browser)
  await signUp(b, 'beto@example.com')
  const otherCode = await createFamily(b, 'Outra')

  await page.goto(`/convite/${otherCode}`)
  await page.getByRole('button', { name: strings.invite.confirm }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Outra' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /arroz/ })).toHaveCount(0)

  await page.getByRole('button', { name: strings.groups.switchLabel }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Casa' }).click()
  await expect(page.getByRole('checkbox', { name: /arroz/ })).toBeVisible()
  await b.context().close()
})
