import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'
import { twoMembers } from './support/members'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const names = Array.from({ length: 16 }, (_, i) => `item${String(i + 1).padStart(2, '0')}`)
const MARGIN = 16
const ROUTES = ['/', '/despensa', '/historico', '/categorias', '/grupo', '/finalizar']

/** Horizontal extent of visible text, inputs and buttons inside <main>. */
async function sideExtents(page: Page) {
  return page.evaluate(() => {
    const out: { what: string; left: number; right: number }[] = []
    const main = document.querySelector('main')!
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim()) continue
      const r = document.createRange()
      r.selectNodeContents(n)
      const b = r.getBoundingClientRect()
      if (b.width > 0) out.push({ what: n.textContent.trim(), left: b.left, right: b.right })
    }
    for (const el of main.querySelectorAll('input,select,textarea')) {
      const b = el.getBoundingClientRect()
      if (b.width > 0) out.push({ what: el.tagName, left: b.left, right: b.right })
    }
    for (const el of main.querySelectorAll('.m3-list-item')) {
      const b = el.getBoundingClientRect()
      if (b.width > 0) out.push({ what: 'row', left: b.left, right: b.right })
    }
    return { width: document.documentElement.clientWidth, out }
  })
}

test('S-103 AC1/AC2: every shell screen clears the nav/add bar and keeps 16px side margins', async ({
  browser,
}) => {
  const { ana } = await twoMembers(browser, names)
  await ana.setViewportSize({ width: 375, height: 560 }) // short: every screen has to scroll
  const nav = ana.getByRole('navigation', { name: strings.nav.label })
  for (const route of ROUTES) {
    await ana.goto(route)
    await expect(nav).toBeVisible()
    await ana.waitForTimeout(400)
    const { width, out } = await sideExtents(ana)
    for (const e of out) {
      expect(e.left, `${route} "${e.what}" left`).toBeGreaterThanOrEqual(MARGIN - 0.5)
      expect(width - e.right, `${route} "${e.what}" right`).toBeGreaterThanOrEqual(MARGIN - 0.5)
    }
    await ana.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const bottom = await ana.evaluate(() => {
      const main = document.querySelector('main')!
      const flow = [...main.querySelectorAll('*')].filter(
        (e) => !e.closest('.add-bar') && getComputedStyle(e).position !== 'fixed',
      )
      return Math.max(...flow.map((e) => e.getBoundingClientRect().bottom))
    })
    const navTop = (await nav.boundingBox())!.y
    const bar = ana.locator('.add-bar')
    const barTop = (await bar.count()) ? (await bar.boundingBox())!.y : navTop
    expect(bottom, `${route} content bottom vs bar`).toBeLessThanOrEqual(Math.min(barTop, navTop))
    if (process.env.SHOTS)
      await ana.screenshot({
        path: `${process.env.SHOTS}/${route.replace(/\W/g, '') || 'lista'}.png`,
      })
  }
})
