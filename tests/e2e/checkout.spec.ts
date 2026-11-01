import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const row = (page: Page, name: string) => page.getByRole('checkbox', { name: new RegExp(name) })
const finalizeLink = (page: Page) => page.getByRole('link', { name: strings.checkout.link })
const finish = (page: Page) =>
  page.getByRole('button', { name: strings.checkout.finish, exact: true })

async function buyAndOpenCheckout(page: Page, names: string[]) {
  for (const n of names) await row(page, n).click()
  for (const n of names) await expect(row(page, n)).toBeChecked()
  await finalizeLink(page).click()
  await expect(page).toHaveURL(/\/finalizar$/)
}

test('S-046 AC3: price + market, only the pending item stays; market is suggested next time', async ({
  browser,
}) => {
  const { ana } = await twoMembers(browser, ['arroz', 'leite', 'pão'])
  await buyAndOpenCheckout(ana, ['arroz', 'leite'])
  await ana.getByLabel(strings.checkout.priceFor('arroz')).fill('5,00')
  await ana.getByLabel(strings.checkout.marketLabel).fill('Atacadão')
  await finish(ana).click()
  await expect(ana).toHaveURL(/\/$/)
  await expect(ana.getByRole('listitem').filter({ hasText: 'pão' })).toBeVisible()
  await expect(ana.getByRole('listitem').filter({ hasText: 'arroz' })).toHaveCount(0)
  await expect(ana.getByRole('listitem').filter({ hasText: 'leite' })).toHaveCount(0)

  const field = ana.getByLabel(strings.list.addLabel)
  await field.fill('café')
  await field.press('Enter')
  await row(ana, 'café').click()
  await finalizeLink(ana).click()
  await expect(ana.locator('datalist option[value="Atacadão"]')).toHaveCount(1)
})

test('S-046 AC4: offline checkout clears bought at once; the other member sees it on reconnect', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, ['arroz', 'leite', 'pão'])
  await row(ana, 'arroz').click()
  await expect(row(beto, 'arroz')).toBeChecked()
  await ana.context().setOffline(true)
  await buyAndOpenCheckout(ana, ['leite'])
  await finish(ana).click()
  await expect(ana).toHaveURL(/\/$/)
  await expect(ana.getByRole('listitem').filter({ hasText: 'leite' })).toHaveCount(0)
  await expect(ana.getByRole('listitem').filter({ hasText: 'pão' })).toBeVisible()
  await ana.context().setOffline(false)
  await expect(row(beto, 'leite')).toHaveCount(0)
  await expect(row(beto, 'pão')).toBeVisible()
})

test('S-046 AC5: finishing without price or market works', async ({ browser }) => {
  const { ana } = await twoMembers(browser, ['arroz', 'pão'])
  await buyAndOpenCheckout(ana, ['arroz'])
  await finish(ana).click()
  await expect(ana).toHaveURL(/\/$/)
  await expect(ana.getByRole('listitem').filter({ hasText: 'arroz' })).toHaveCount(0)
  await expect(ana.getByRole('listitem').filter({ hasText: 'pão' })).toBeVisible()
})
