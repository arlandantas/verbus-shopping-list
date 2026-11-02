import { devices, expect, test } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

test('S-084 AC4: login, list, add item and family tab raise no CSP violation', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] }
    w.__csp = []
    document.addEventListener('securitypolicyviolation', (e) =>
      w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    )
  })
  await page.goto('/entrar')
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1)
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await expect(page).toHaveURL(/\/grupo$/)
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await expect(page.getByTestId('invite-code')).toBeVisible()
  const nav = page.getByRole('navigation', { name: strings.nav.label })
  await nav.getByRole('link', { name: strings.nav.list, exact: true }).click()
  await page.getByLabel(strings.list.addLabel).fill('Leite')
  await page.getByLabel(strings.list.addLabel).press('Enter')
  await expect(page.getByRole('listitem').filter({ hasText: 'Leite' })).toBeVisible()
  await nav.getByRole('link', { name: strings.family.title, exact: true }).click()
  await expect(page.getByTestId('invite-code')).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([])
})
