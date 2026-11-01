import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const row = (page: Page, name: string) => page.getByRole('checkbox', { name: new RegExp(name) })
const item = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })
const bought = (page: Page, name: string) => expect(row(page, name)).toBeChecked()
const pending = (page: Page, name: string) => expect(row(page, name)).not.toBeChecked()

test('S-030 AC1: a mark in one member shows struck through in the other without reload', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, ['leite'])
  await row(ana, 'leite').click()
  await bought(beto, 'leite')
  await expect(item(beto, 'leite').getByText('leite')).toHaveCSS(
    'text-decoration-line',
    'line-through',
  )
})

test('S-030 AC2: offline marks show at once as pending sync; reconnect clears and syncs', async ({
  browser,
}) => {
  const items = ['arroz', 'feijão', 'leite']
  const { ana, beto } = await twoMembers(browser, items)
  await ana.context().setOffline(true)
  await expect(ana.getByText(strings.offline)).toBeVisible()
  for (const n of items) await row(ana, n).click()
  for (const n of items) {
    await bought(ana, n)
    await expect(item(ana, n).getByText(strings.list.pendingSync)).toBeVisible()
  }
  for (const n of items) await pending(beto, n)

  await ana.context().setOffline(false)
  await expect(ana.getByText(strings.list.pendingSync)).toHaveCount(0)
  await expect(ana.getByText(strings.offline)).toHaveCount(0)
  for (const n of items) await bought(beto, n)
})

test('S-030 AC3: reloading while still offline keeps the marks', async ({ browser }) => {
  const { ana } = await twoMembers(browser, ['arroz', 'leite'])
  await ana.evaluate(() => navigator.serviceWorker.ready)
  await ana.reload() // first load is not SW-controlled until it claims clients
  await expect(row(ana, 'arroz')).toBeVisible()
  await ana.context().setOffline(true)
  await row(ana, 'arroz').click()
  await bought(ana, 'arroz')
  await ana.reload()
  await bought(ana, 'arroz')
  await pending(ana, 'leite')
  await expect(ana.getByText(strings.offline)).toBeVisible()
})

test('S-030 AC4: a member undoes an item marked by the other; both see pending', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, ['leite'])
  await row(ana, 'leite').click()
  await bought(beto, 'leite')
  await row(beto, 'leite').click()
  await pending(beto, 'leite')
  await pending(ana, 'leite')
  await expect(ana.getByText(/^por /)).toHaveCount(0)
})

test('S-058 AC8: marking arroz and tapping Desfazer leaves it pending on both devices', async ({
  browser,
}) => {
  const { ana, beto } = await twoMembers(browser, ['arroz'])
  await row(ana, 'arroz').click()
  await bought(beto, 'arroz')
  await expect(ana.getByText(strings.list.addedToCart)).toBeVisible()
  await ana.getByRole('button', { name: strings.list.undo }).click()
  await pending(ana, 'arroz')
  await pending(beto, 'arroz')
})
