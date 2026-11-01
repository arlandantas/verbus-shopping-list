import { devices, expect, test, type Page } from '@playwright/test'
import { formatBRL } from '../../src/domain/price'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const row = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(name) })

test('S-047 AC4: checkout then history shows the month read-only with correct sums', async ({
  browser,
}) => {
  const { ana } = await twoMembers(browser, ['arroz', 'leite'])
  for (const n of ['arroz', 'leite']) await row(ana, n).click()
  for (const n of ['arroz', 'leite'])
    await expect(row(ana, n)).toHaveAttribute('aria-pressed', 'true')
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
  await ana.getByRole('button', { name: strings.market.enter }).click()
  await row(ana, 'feijão').click()
  await expect(row(ana, 'feijão')).toHaveAttribute('aria-pressed', 'true')
  await ana.getByRole('link', { name: strings.checkout.link }).click()
  await ana.getByRole('button', { name: strings.checkout.finish, exact: true }).click()
  await expect(ana).toHaveURL(/\/$/)

  await ana.getByRole('link', { name: strings.history.link, exact: true }).click()
  await ana.getByRole('list', { name: strings.history.monthsLabel }).getByRole('link').click()
  const add = ana.getByRole('button', { name: strings.history.addToListFor('feijão') })
  await add.click()
  await expect(
    ana.getByRole('button', { name: strings.history.inListFor('feijão') }),
  ).toBeDisabled()
  await expect(ana.getByText('feijão')).toBeVisible()

  await ana.goto('/')
  const item = ana.getByRole('listitem').filter({ hasText: 'feijão' })
  await expect(item).toContainText('2 kg')
  await expect(item).toHaveCount(1)
})
