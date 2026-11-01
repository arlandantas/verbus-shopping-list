import { devices, expect, test } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const TABS = [
  { name: strings.nav.list, url: /\/$/ },
  { name: strings.pantry.link, url: /\/despensa$/ },
  { name: strings.history.link, url: /\/historico$/ },
  { name: strings.family.title, url: /\/familia$/ },
]

test('S-053 AC5: each tab changes the URL and the bar stays visible', async ({ browser }) => {
  const { ana } = await twoMembers(browser, ['arroz'])
  const nav = ana.getByRole('navigation', { name: strings.nav.label })
  for (const tab of [...TABS.slice(1), TABS[0]!]) {
    await nav.getByRole('link', { name: tab.name, exact: true }).click()
    await expect(ana).toHaveURL(tab.url)
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('link', { name: tab.name, exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
  }
})

test('S-053 AC5: the last list item scrolls into view above the bar', async ({ browser }) => {
  const names = Array.from({ length: 16 }, (_, i) => `item${String(i + 1).padStart(2, '0')}`)
  const { ana } = await twoMembers(browser, names)
  await ana.goto('/')
  const last = ana.getByRole('listitem').filter({ hasText: names.at(-1)! })
  await last.scrollIntoViewIfNeeded()
  await ana.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const nav = ana.getByRole('navigation', { name: strings.nav.label })
  const lastBox = (await last.boundingBox())!
  const navBox = (await nav.boundingBox())!
  expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(navBox.y + 1)
})

test('S-053 AC4: sub-screens keep the parent tab and Voltar returns to it', async ({ browser }) => {
  const { ana } = await twoMembers(browser, ['arroz'])
  const nav = ana.getByRole('navigation', { name: strings.nav.label })
  await nav.getByRole('link', { name: strings.family.title, exact: true }).click()
  await ana.getByRole('link', { name: strings.categories.link }).click()
  await expect(ana).toHaveURL(/\/categorias$/)
  await expect(nav.getByRole('link', { name: strings.family.title, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await ana.getByRole('button', { name: strings.back }).click()
  await expect(ana).toHaveURL(/\/familia$/)
})
