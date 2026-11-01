import { devices, expect, test } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const names = Array.from({ length: 16 }, (_, i) => `item${String(i + 1).padStart(2, '0')}`)

test('S-072 AC1: tabs are grouped and centered on wide screens, spread on phones', async ({
  browser,
}) => {
  const { ana } = await twoMembers(browser, ['arroz'])
  const links = ana.getByRole('navigation', { name: strings.nav.label }).getByRole('link')
  await ana.setViewportSize({ width: 1280, height: 800 })
  const boxes = await Promise.all((await links.all()).map((l) => l.boundingBox()))
  const left = boxes[0]!.x
  const right = boxes.at(-1)!.x + boxes.at(-1)!.width
  expect(boxes).toHaveLength(4)
  expect(right - left).toBeLessThanOrEqual(562)
  expect(Math.abs(left - (1280 - right))).toBeLessThanOrEqual(2)
  await ana.setViewportSize({ width: 375, height: 800 })
  const narrow = await Promise.all((await links.all()).map((l) => l.boundingBox()))
  expect(narrow[0]!.x).toBeLessThanOrEqual(2)
  expect(375 - (narrow.at(-1)!.x + narrow.at(-1)!.width)).toBeLessThanOrEqual(2)
})

test('S-072 AC2/AC3: floating pill above the tabs; notices stack without overlap', async ({
  browser,
}) => {
  const { ana } = await twoMembers(browser, names)
  const bar = ana.locator('.add-bar')
  const style = await bar.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { radius: parseFloat(cs.borderTopLeftRadius), shadow: cs.boxShadow }
  })
  expect(style.radius).toBeGreaterThan(100)
  expect(style.shadow).not.toBe('none')
  const nav = ana.getByRole('navigation', { name: strings.nav.label })
  const barBox = (await bar.boundingBox())!
  const navBox = (await nav.boundingBox())!
  expect(barBox.y + barBox.height).toBeLessThanOrEqual(navBox.y - 8 + 1)

  await ana.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const last = ana.getByRole('listitem').filter({ hasText: names.at(-1)! })
  const lastBox = (await last.boundingBox())!
  expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(barBox.y)
  await last.click({ trial: true })

  await ana.context().setOffline(true)
  const notice = ana.getByRole('status').filter({ hasText: strings.offline })
  await expect(notice).toBeVisible()
  const nb = (await notice.boundingBox())!
  const fb = (await bar.boundingBox())!
  expect(nb.y + nb.height).toBeLessThanOrEqual(fb.y)
  await ana.context().setOffline(false)
})
