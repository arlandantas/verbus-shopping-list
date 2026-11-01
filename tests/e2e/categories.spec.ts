import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const t = strings.categories
const DEFAULTS = ['Mercearia', 'Hortifrúti', 'Carnes', 'Laticínios', 'Limpeza', 'Higiene pessoal']
const row = (page: Page, name: string) =>
  page.getByRole('list', { name: t.listLabel }).getByRole('listitem').filter({ hasText: name })

async function signUpWithFamily(page: Page) {
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await expect(page.getByTestId('invite-code')).toBeVisible()
}

async function openFromFamily(page: Page) {
  await page.getByRole('link', { name: t.link }).click()
  await expect(page).toHaveURL(/\/categorias$/)
}

test('S-042 AC3: new family sees 6 defaults; create, rename, delete sync to another member', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, [])
  for (const p of [ana, beto]) {
    await p.goto('/categorias')
    for (const n of DEFAULTS) await expect(row(p, n)).toBeVisible()
    await expect(row(p, 'Mercearia').getByRole('button')).toHaveCount(0)
  }
  await ana.getByLabel(t.newLabel).fill('Pet')
  await ana.getByRole('button', { name: t.add }).click()
  await expect(row(ana, 'Pet')).toBeVisible()
  await expect(row(beto, 'Pet')).toBeVisible()

  await ana.getByRole('button', { name: t.renameFor('Pet') }).click()
  await ana.getByLabel(t.renameLabel('Pet')).fill('Pets')
  await ana.getByRole('button', { name: t.save }).click()
  await expect(row(ana, 'Pets')).toBeVisible()
  await expect(row(beto, 'Pets')).toBeVisible()

  await ana.getByRole('button', { name: t.deleteFor('Pets') }).click()
  await expect(ana.getByText(t.confirmDelete('Pets'))).toBeVisible()
  await ana.getByRole('button', { name: t.confirm }).click()
  await expect(row(ana, 'Pets')).toHaveCount(0)
  await expect(row(beto, 'Pets')).toHaveCount(0)
})

test('S-042 AC4: Categorias link on Família opens /categorias; Voltar returns', async ({
  page,
}) => {
  await signUpWithFamily(page)
  await openFromFamily(page)
  await page.getByRole('link', { name: t.back }).click()
  await expect(page).toHaveURL(/\/familia$/)
})

test('S-042 AC5: offline, creating Bebidas shows at once and syncs on reconnect', async ({
  page,
  context,
}) => {
  await signUpWithFamily(page)
  await openFromFamily(page)
  await expect(row(page, 'Mercearia')).toBeVisible()
  await context.setOffline(true)
  await page.getByLabel(t.newLabel).fill('Bebidas')
  await page.getByRole('button', { name: t.add }).click()
  await expect(row(page, 'Bebidas')).toBeVisible()
  await context.setOffline(false)
  await page.reload()
  await expect(row(page, 'Bebidas')).toBeVisible()
  await expect(page.getByText(strings.offline)).toHaveCount(0)
})
