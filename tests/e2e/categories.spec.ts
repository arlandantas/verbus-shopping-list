import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const t = strings.categories
const SUGGESTIONS = [
  'Mercearia',
  'Hortifrúti',
  'Carnes',
  'Laticínios',
  'Limpeza',
  'Higiene pessoal',
]
const chip = (page: Page, name: string) =>
  page.getByRole('button', { name: t.suggestionChip(name), exact: true })
const row = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })

async function createCategory(page: Page, name: string) {
  await page.getByRole('button', { name: t.newLabel }).click()
  await page.getByLabel(t.nameLabel).fill(name)
  await page.getByRole('button', { name: t.save }).click()
}

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

test('S-092 AC8: new group opens Categorias empty with 6 suggestions; tapping Mercearia moves it to the user list', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, [])
  for (const p of [ana, beto]) {
    await p.goto('/categorias')
    await expect(p.getByText(t.emptyUser)).toBeVisible()
    for (const n of SUGGESTIONS) await expect(chip(p, n)).toBeVisible()
    await expect(p.getByRole('heading', { name: t.defaultSection })).toHaveCount(0)
  }
  await chip(ana, 'Mercearia').click()
  const mine = ana.getByRole('list', { name: t.userList })
  await expect(mine.getByRole('listitem').filter({ hasText: 'Mercearia' })).toBeVisible()
  await expect(chip(ana, 'Mercearia')).toHaveCount(0)
  await expect(chip(ana, 'Hortifrúti')).toBeVisible()
  await expect(row(beto, 'Mercearia')).toBeVisible() // synced
  await expect(chip(beto, 'Mercearia')).toHaveCount(0)
})

test('S-042 AC3: create, rename, delete sync to another member', async ({ browser }) => {
  const { ana, beto } = await twoMembers(browser, [])
  for (const p of [ana, beto]) await p.goto('/categorias')
  await createCategory(ana, 'Pet')
  await expect(row(ana, 'Pet')).toBeVisible()
  await expect(row(beto, 'Pet')).toBeVisible()

  await ana.getByRole('button', { name: t.renameFor('Pet') }).click()
  await ana.getByLabel(t.renameLabel('Pet')).fill('Pets')
  await ana.getByRole('button', { name: t.save }).click()
  await expect(row(ana, 'Pets')).toBeVisible()
  await expect(row(beto, 'Pets')).toBeVisible()

  await ana.getByRole('button', { name: t.deleteFor('Pets') }).click()
  await expect(ana.getByRole('dialog', { name: t.confirmDelete('Pets') })).toBeVisible()
  await ana.getByRole('button', { name: t.confirm }).click()
  await expect(row(ana, 'Pets')).toHaveCount(0)
  await expect(row(beto, 'Pets')).toHaveCount(0)
})

test('S-042 AC4: Categorias link on Grupo opens /categorias; Voltar icon returns', async ({
  page,
}) => {
  await signUpWithFamily(page)
  await openFromFamily(page)
  await page.getByRole('button', { name: strings.back }).click()
  await expect(page).toHaveURL(/\/grupo$/)
})

test('S-042 AC5: offline, creating Bebidas shows at once and syncs on reconnect', async ({
  page,
  context,
}) => {
  await signUpWithFamily(page)
  await openFromFamily(page)
  await expect(chip(page, 'Mercearia')).toBeVisible()
  await context.setOffline(true)
  await createCategory(page, 'Bebidas')
  await expect(row(page, 'Bebidas')).toBeVisible()
  await context.setOffline(false)
  await page.reload()
  await expect(row(page, 'Bebidas')).toBeVisible()
  await expect(page.getByText(strings.offline)).toHaveCount(0)
})
