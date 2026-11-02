import { expect, test } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'

test.use({ viewport: { width: 375, height: 667 } })

test('S-109 AC2: landing primary action stays above the fold at 375x667', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(strings.landing.heroSubtitle)).toBeVisible()
  const btn = page.getByRole('button', { name: strings.landing.createAccount }).first()
  await expect(btn).toBeVisible()
  const box = await btn.boundingBox()
  expect(box!.y + box!.height).toBeLessThanOrEqual(667)
})
