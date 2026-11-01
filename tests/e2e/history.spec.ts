import { devices, expect, test, type Page } from '@playwright/test'
import { formatBRL } from '../../src/domain/price'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const row = (page: Page, name: string) => page.getByRole('checkbox', { name: new RegExp(name) })

test('S-047 AC4: checkout then history shows the month read-only with correct sums', async ({
  browser,
}) => {
  const { ana } = await twoMembers(browser, ['arroz', 'leite'])
  for (const n of ['arroz', 'leite']) await row(ana, n).click()
  for (const n of ['arroz', 'leite']) await expect(row(ana, n)).toBeChecked()
  await ana.getByRole('link', { name: strings.checkout.link }).click()
  await ana.getByLabel(strings.checkout.priceFor('arroz')).fill('5,00')
  await ana.getByLabel(strings.checkout.priceFor('leite')).fill('3,50')
  await ana.getByLabel(strings.checkout.marketLabel).fill('Atacadão')
  await ana.getByRole('button', { name: strings.checkout.finish, exact: true }).click()
  await expect(ana).toHaveURL(/\/$/)

  await ana.getByRole('link', { name: strings.history.link, exact: true }).click()
  await expect(ana).toHaveURL(/\/historico$/)
  const month = ana.getByRole('list', { name: strings.history.monthsLabel }).getByRole('link')
  await expect(month).toContainText(`${formatBRL(850)} · 2 itens`)
  await month.click()
  await expect(ana).toHaveURL(/\/historico\/\d{4}-\d{2}$/)
  await expect(ana.getByText('Atacadão')).toBeVisible()
  await expect(ana.getByText('arroz')).toBeVisible()
  await expect(ana.getByText('leite')).toBeVisible()
  await expect(ana.getByRole('region', { name: strings.history.categorySumTitle })).toContainText(
    `${strings.history.total}${formatBRL(850)}`,
  )
  await expect(ana.getByRole('textbox')).toHaveCount(0)
})

test('S-047 AC5: invalid cycle redirects to /historico', async ({ browser }) => {
  const { ana } = await twoMembers(browser, ['arroz'])
  await ana.goto('/historico/xyz')
  await expect(ana).toHaveURL(/\/historico$/)
  await expect(ana.getByText(strings.history.empty)).toBeVisible()
})

test('S-048 AC3: re-adding a history line puts it back on the list; history is unchanged', async ({
  browser,
}) => {
  const { ana } = await twoMembers(browser, [])
  await ana.goto('/')
  await ana.getByLabel(strings.list.addLabel).fill('2 kg feijão')
  await ana.getByLabel(strings.list.addLabel).press('Enter')
  await expect(ana.getByRole('listitem').filter({ hasText: 'feijão' })).toContainText('2 kg')
  await row(ana, 'feijão').click()
  await expect(row(ana, 'feijão')).toBeChecked()
  await ana.getByRole('link', { name: strings.checkout.link }).click()
  await ana.getByRole('button', { name: strings.checkout.finish, exact: true }).click()
  await expect(ana).toHaveURL(/\/$/)

  await ana.getByRole('link', { name: strings.history.link, exact: true }).click()
  await ana.getByRole('list', { name: strings.history.monthsLabel }).getByRole('link').click()
  const add = ana.getByRole('button', { name: strings.history.readdFor('feijão') })
  await add.click()
  await expect(
    ana.getByRole('button', { name: strings.history.inListFor('feijão') }),
  ).toBeDisabled()
  await expect(ana.getByText('feijão', { exact: true })).toBeVisible()
  await expect(ana.getByRole('status')).toContainText(strings.history.readded('feijão'))

  await ana.goto('/')
  const item = ana.getByRole('listitem').filter({ hasText: 'feijão' })
  await expect(item).toContainText('2 kg')
  await expect(item).toHaveCount(1)
})

test('S-066 AC5: two purchases in a month show as cards; category sums still hold', async ({
  browser,
}) => {
  const { ana } = await twoMembers(browser, ['arroz', 'leite'])
  await row(ana, 'arroz').click()
  await expect(row(ana, 'arroz')).toBeChecked()
  await ana.getByRole('link', { name: strings.checkout.link }).click()
  await ana.getByLabel(strings.checkout.priceFor('arroz')).fill('5,00')
  await ana.getByLabel(strings.checkout.marketLabel).fill('Mercado A')
  await ana.getByRole('button', { name: strings.checkout.finish, exact: true }).click()
  await expect(ana).toHaveURL(/\/$/)
  await row(ana, 'leite').click()
  await expect(row(ana, 'leite')).toBeChecked()
  await ana.getByRole('link', { name: strings.checkout.link }).click()
  await ana.getByRole('button', { name: strings.checkout.finish, exact: true }).click()
  await expect(ana).toHaveURL(/\/$/)

  await ana.getByRole('link', { name: strings.history.link, exact: true }).click()
  await ana.getByRole('list', { name: strings.history.monthsLabel }).getByRole('link').click()
  await expect(ana.getByRole('region', { name: strings.history.categorySumTitle })).toContainText(
    formatBRL(500),
  )
  await ana.getByRole('radio', { name: strings.history.byPurchase }).click()
  const cards = ana.getByRole('region').filter({ hasText: /\d{1,2} de / })
  await expect(cards).toHaveCount(2)
  await expect(cards.nth(0)).toContainText(strings.history.noMarket)
  await expect(cards.nth(0)).toContainText(strings.history.noValues)
  await expect(cards.nth(0)).toContainText('leite')
  await expect(cards.nth(1)).toContainText('Mercado A')
  await expect(cards.nth(1)).toContainText(formatBRL(500))
  await expect(cards.nth(1)).toContainText('arroz')

  await ana.getByRole('radio', { name: strings.history.byCategory }).click()
  await expect(ana.getByRole('region', { name: strings.history.categorySumTitle })).toContainText(
    formatBRL(500),
  )
})

test('S-068 AC4/AC5: edit a purchased line; other member sees it; offline works', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, ['arroz'])
  await row(ana, 'arroz').click()
  await expect(row(ana, 'arroz')).toBeChecked()
  await ana.getByRole('link', { name: strings.checkout.link }).click()
  await ana.getByRole('button', { name: strings.checkout.finish, exact: true }).click()
  await expect(ana).toHaveURL(/\/$/)

  await beto.getByRole('link', { name: strings.history.link, exact: true }).click()
  await beto.getByRole('list', { name: strings.history.monthsLabel }).getByRole('link').click()
  await beto.getByRole('radio', { name: strings.history.byPurchase }).click()

  await ana.getByRole('link', { name: strings.history.link, exact: true }).click()
  await ana.getByRole('list', { name: strings.history.monthsLabel }).getByRole('link').click()
  await ana.getByRole('radio', { name: strings.history.byPurchase }).click()
  await ana.getByRole('button', { name: strings.history.editFor('arroz') }).click()
  const sheet = ana.getByRole('dialog', { name: strings.history.editTitle })
  await sheet.getByLabel(strings.item.quantity).fill('2')
  await sheet.getByLabel(strings.item.price).fill('12,90')
  await sheet.getByRole('button', { name: strings.item.save }).click()
  await expect(sheet).toHaveCount(0)
  const line = ana.getByRole('listitem').filter({ hasText: 'arroz' })
  await expect(line).toContainText(formatBRL(1290))
  await expect(line).toContainText('2 un')
  await expect(ana.getByRole('region').filter({ hasText: /\d{1,2} de / })).toContainText(
    formatBRL(1290),
  )
  await expect(beto.getByRole('listitem').filter({ hasText: 'arroz' })).toContainText(
    formatBRL(1290),
  )
  await ana.getByRole('radio', { name: strings.history.byCategory }).click()
  await expect(ana.getByRole('region', { name: strings.history.categorySumTitle })).toContainText(
    formatBRL(1290),
  )

  // AC5: offline edit shows at once and persists after reconnect
  await ana.getByRole('radio', { name: strings.history.byPurchase }).click()
  await ana.context().setOffline(true)
  await ana.getByRole('button', { name: strings.history.editFor('arroz') }).click()
  await sheet.getByLabel(strings.item.price).fill('15,00')
  await sheet.getByRole('button', { name: strings.item.save }).click()
  await expect(ana.getByRole('listitem').filter({ hasText: 'arroz' })).toContainText(
    formatBRL(1500),
  )
  await ana.context().setOffline(false)
  await ana.reload()
  await ana.getByRole('radio', { name: strings.history.byPurchase }).click()
  await expect(ana.getByRole('listitem').filter({ hasText: 'arroz' })).toContainText(
    formatBRL(1500),
  )
})
