import { devices, expect, test } from '@playwright/test'

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
    await page.goto('/')
    const { bg, fg, bgRgb } = await bodyColors(page)
    seen.push(bg)
    expect(contrast(fg as Rgb, bgRgb as Rgb)).toBeGreaterThanOrEqual(4.5)
    await context.close()
  }
  expect(seen[0]).not.toBe(seen[1])
})
