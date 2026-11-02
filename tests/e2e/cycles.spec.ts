import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators, waitForItemCount } from './support/emulator'
import { signIn, twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const NOVEMBER = new Date('2026-11-15T15:00:00Z')
const DECEMBER = new Date('2026-12-02T15:00:00Z')

const rows = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })
const notice = (page: Page) => page.getByRole('status').filter({ hasText: /recorrente/ })

/** November: "arroz" is recurring, bought and the purchase finished (nothing left on the list). */
async function buyRecurringInNovember(browser: Browser) {
  const { ana, beto } = await twoMembers(browser, ['arroz'], NOVEMBER)
  await ana.goto('/entrar')
  await ana.getByRole('button', { name: strings.list.edit('arroz') }).click()
  await ana.getByLabel(strings.item.recurring).check()
  await ana.getByRole('button', { name: strings.item.save }).click()
  await expect(ana).toHaveURL(/\/$/)
  await ana.getByRole('checkbox', { name: /arroz/ }).click()
  await expect(ana.getByRole('checkbox', { name: /arroz/ })).toBeChecked()
  await ana.getByRole('link', { name: strings.checkout.link }).click()
  await ana.getByRole('button', { name: strings.checkout.finish, exact: true }).click()
  await expect(ana).toHaveURL(/\/$/)
  await expect(rows(ana, 'arroz')).toHaveCount(0)
  await waitForItemCount(0)
  await ana.context().close()
  await beto.context().close()
}

test('S-049 AC2: the recurring item returns pending in December and the notice shows once', async ({
  browser,
}) => {
  await buyRecurringInNovember(browser)
  const ana = await signIn(browser, 'ana@example.com', DECEMBER)
  await expect(rows(ana, 'arroz')).toHaveCount(1)
  await expect(notice(ana)).toHaveText(new RegExp(strings.cycle.returned(1)))
  await ana.getByRole('button', { name: strings.cycle.ok }).click()
  await expect(notice(ana)).toHaveCount(0)
  await ana.reload()
  await expect(rows(ana, 'arroz')).toHaveCount(1)
  await expect(notice(ana)).toHaveCount(0)
  await waitForItemCount(1)
})

test('S-049 AC3: both members opening in December get "arroz" exactly once', async ({
  browser,
}) => {
  await buyRecurringInNovember(browser)
  const [ana, beto] = await Promise.all([
    signIn(browser, 'ana@example.com', DECEMBER),
    signIn(browser, 'beto@example.com', DECEMBER),
  ])
  await waitForItemCount(1)
  for (const p of [ana, beto]) {
    await expect(rows(p, 'arroz')).toHaveCount(1)
    await p.reload()
    await expect(rows(p, 'arroz')).toHaveCount(1)
  }
  await waitForItemCount(1)
})
