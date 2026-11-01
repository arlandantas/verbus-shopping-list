import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const EMAIL = 'ana@example.com'
const PASSWORD = 'secret123'
const CODE = /^[2-9A-HJKMNP-Z]{8}$/

async function signUp(page: Page) {
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill(EMAIL)
  await page.getByLabel(strings.login.password).fill(PASSWORD)
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await expect(page).toHaveURL(/\/familia$/)
}

async function createFamily(page: Page, name = 'Casa') {
  await page.getByLabel(strings.family.nameLabel).fill(name)
  await page.getByRole('button', { name: strings.family.create }).click()
  await expect(page.getByTestId('invite-code')).toBeVisible()
}

test('S-011 AC1: signed in without family, / redirects to /familia', async ({ page }) => {
  await signUp(page)
  await page.goto('/')
  await expect(page).toHaveURL(/\/familia$/)
  await expect(page.getByLabel(strings.family.nameLabel)).toBeVisible()
})

test('S-011 AC2: creating a family shows code and link, then / shows the name', async ({
  page,
}) => {
  await signUp(page)
  await createFamily(page)
  const code = (await page.getByTestId('invite-code').textContent()) ?? ''
  expect(code).toMatch(CODE)
  await expect(page.getByTestId('invite-link')).toHaveText(
    `${new URL(page.url()).origin}/convite/${code}`,
  )
  await page
    .getByRole('navigation', { name: strings.nav.label })
    .getByRole('link', { name: strings.nav.list, exact: true })
    .click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Casa' })).toBeVisible()
})

test('S-011 AC3: with a family, /familia shows name, members and invite', async ({ page }) => {
  await signUp(page)
  await createFamily(page)
  await page.goto('/familia')
  await expect(page.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await expect(page.getByText(strings.family.members(1))).toBeVisible()
  await expect(page.getByTestId('invite-code')).toHaveText(CODE)
  await expect(page.getByLabel(strings.family.nameLabel)).toHaveCount(0)
})

test('S-011 AC4: share uses navigator.share, else copies the link', async ({ page }) => {
  await signUp(page)
  await createFamily(page)
  const link = (await page.getByTestId('invite-link').textContent()) ?? ''
  const share = page.getByRole('button', { name: strings.family.invite.share })

  await page.evaluate(() => {
    const w = window as unknown as { __shared: unknown[]; __copied: string[] }
    w.__shared = []
    w.__copied = []
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: unknown) => (w.__shared.push(data), Promise.resolve()),
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: (t: string) => (w.__copied.push(t), Promise.resolve()) },
    })
  })
  await share.click()
  expect(
    await page.evaluate(() => (window as never as { __shared: { url: string }[] }).__shared),
  ).toEqual([expect.objectContaining({ url: link })])

  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }))
  await share.click()
  await expect(page.getByText(strings.family.invite.copied)).toBeVisible()
  expect(await page.evaluate(() => (window as never as { __copied: string[] }).__copied)).toEqual([
    link,
  ])
})

test('S-011 AC5: offline, create is disabled with a pt-BR warning', async ({ page, context }) => {
  await signUp(page)
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await context.setOffline(true)
  await expect(page.getByRole('button', { name: strings.family.create })).toBeDisabled()
  await expect(page.getByText(strings.family.offlineWarning)).toBeVisible()
})
