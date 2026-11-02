import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { setItemCategory } from './support/categorize'
import { clearEmulators, deleteAllItems, waitForItemCount } from './support/emulator'
import { newMember } from './support/members'

test.use({ ...devices['Pixel 7'] })

type Rgb = [number, number, number]

function luminance([r, g, b]: Rgb): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as Rgb
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

async function bodyColors(page: import('@playwright/test').Page) {
  // Canvas normalizes any CSS color syntax (e.g. oklch/lab) to RGBA.
  return page.evaluate(() => {
    const cs = getComputedStyle(document.body)
    const ctx = document.createElement('canvas').getContext('2d')!
    const toRgb = (c: string): number[] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = c
      ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3)
    }
    return { bg: cs.backgroundColor, fg: toRgb(cs.color), bgRgb: toRgb(cs.backgroundColor) }
  })
}

test('S-051 AC5: dark and light differ, both with contrast >= 4.5', async ({ browser }) => {
  const seen: string[] = []
  for (const colorScheme of ['light', 'dark'] as const) {
    const context = await browser.newContext({ ...devices['Pixel 7'], colorScheme })
    const page = await context.newPage()
    await page.goto('/entrar')
    const { bg, fg, bgRgb } = await bodyColors(page)
    seen.push(bg)
    expect(contrast(fg as Rgb, bgRgb as Rgb)).toBeGreaterThanOrEqual(4.5)
    await context.close()
  }
  expect(seen[0]).not.toBe(seen[1])
})

type Bad = { text: string; ratio: number; need: number }

/** Contrast of every visible text node / svg against the effective (composited) background. */
async function audit(page: Page): Promise<Bad[]> {
  return page.evaluate(() => {
    const ctx = document.createElement('canvas').getContext('2d')!
    const toRgba = (c: string): number[] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = c
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0]!, d[1]!, d[2]!, d[3]! / 255]
    }
    const lum = (c: number[]) => {
      const [r, g, b] = c.slice(0, 3).map((v) => {
        const s = v! / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      }) as [number, number, number]
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number]
      return (hi + 0.05) / (lo + 0.05)
    }
    const bgOf = (el: Element): number[] => {
      const layers: number[][] = []
      for (let e: Element | null = el; e; e = e.parentElement) {
        const c = toRgba(getComputedStyle(e).backgroundColor)
        if (c[3]! > 0) layers.push(c)
        if (c[3] === 1) break
      }
      let out = toRgba(getComputedStyle(document.body).backgroundColor)
      if (out[3] === 0) out = [255, 255, 255, 1]
      for (const l of layers.reverse())
        out = [0, 1, 2].map((i) => l[i]! * l[3]! + out[i]! * (1 - l[3]!)).concat([1])
      return out
    }
    const bad: { text: string; ratio: number; need: number }[] = []
    const check = (el: Element, label: string) => {
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.opacity === '0')
        return
      if (el.closest('[disabled],[aria-disabled="true"]')) return // WCAG exempts inactive controls
      const size = parseFloat(cs.fontSize)
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700)
      const isSvg = el instanceof SVGElement
      const fg = toRgba(cs.color)
      if (fg[3] === 0) return // intentionally invisible (e.g. unchecked checkbox mark)
      const need = isSvg || large ? 3 : 4.5
      const bg = bgOf(el)
      const eff = fg.slice(0, 3).map((v, i) => v! * fg[3]! + bg[i]! * (1 - fg[3]!))
      const ra = ratio(eff, bg)
      if (ra < need) bad.push({ text: label, ratio: Math.round(ra * 100) / 100, need })
    }
    for (const el of document.body.querySelectorAll('*')) {
      if (el instanceof SVGElement && el.tagName === 'svg')
        check(el, `svg ${el.parentElement?.className}`)
      if (el instanceof SVGElement) continue
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent!.trim())
        .join(' ')
      if (own) check(el, own.slice(0, 40))
    }
    return bad
  })
}

test('S-070 AC3: every visible text meets contrast in light and dark across screens', async ({
  browser,
}) => {
  await clearEmulators()
  const page = await newMember(browser, 'ana@example.com', 'Ana')
  await expect(page).toHaveURL(/\/grupo$/)
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await page
    .getByRole('navigation', { name: strings.nav.label })
    .getByRole('link', { name: strings.nav.list, exact: true })
    .click()
  const field = page.getByLabel(strings.list.addLabel)
  const add = async (text: string, name: string) => {
    await field.fill(text)
    await field.press('Enter')
    await expect(page.getByRole('listitem').filter({ hasText: name })).toBeVisible()
  }
  await add('queijo', 'queijo')
  await waitForItemCount(1)
  await deleteAllItems()
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await add('3 kg feijão', 'feijão')
  await add('arroz', 'arroz')
  await add('leite', 'leite')
  await setItemCategory(page, 'arroz', 'Mercearia')
  await page.getByRole('button', { name: strings.list.edit('feijão') }).click()
  await page.getByLabel(strings.item.recurring).check()
  await page.getByRole('button', { name: strings.item.save }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole('listitem').filter({ hasText: 'leite' }).click()
  await page.getByText(strings.market.hideInCart).click()
  await expect(page.getByText(strings.market.hiddenCount(1))).toBeVisible()

  const results: Record<string, Bad[]> = {}
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    const at = (name: string) => `${scheme} ${name}`
    await field.fill('qu')
    await expect(page.getByRole('option').first()).toBeVisible()
    results[at('list+suggestions')] = await audit(page)
    await field.fill('')
    for (const [route, name] of [
      ['/despensa', 'pantry'],
      ['/historico', 'history'],
      ['/grupo', 'family'],
      ['/finalizar', 'checkout'],
      ['/categorias', 'categories'],
    ] as const) {
      await page.goto(route)
      await expect(page.getByRole('heading').first()).toBeVisible()
      await page.waitForTimeout(300)
      results[at(name)] = await audit(page)
    }
    await page.goto('/entrar')
    await expect(field).toBeVisible()
  }
  const failures = Object.fromEntries(Object.entries(results).filter(([, v]) => v.length > 0))
  expect(failures).toEqual({})
})
