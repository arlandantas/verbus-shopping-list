import { devices, expect, test } from '@playwright/test'
import { TEST_ACCOUNTS } from '../../scripts/seed/accounts.ts'
import { SEED_ITEMS } from '../../scripts/seed/data.ts'
import { seedEmulators } from '../../scripts/seed/index.ts'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
  await seedEmulators()
})

const account = (key: string) => TEST_ACCOUNTS.find((a) => a.key === key)!

test('S-050 AC6: couple account lands on the list with the seeded items', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/entrar$/)
  await page.getByRole('button', { name: new RegExp(account('ana').displayName) }).click()
  await expect(page.getByLabel(strings.list.addLabel)).toBeVisible()
  const pending = SEED_ITEMS.filter((i) => !i.boughtBy)
  for (const item of pending) {
    await expect(page.getByRole('listitem').filter({ hasText: item.name }).first()).toBeVisible()
  }
})

test('S-050 AC6: the account without a family lands on create/join', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByRole('button', { name: new RegExp(account('carla').displayName) }).click()
  await expect(page).toHaveURL(/\/grupo$/)
  await expect(page.getByLabel(strings.family.nameLabel)).toBeVisible()
})

test('S-089: legacy-profile account (Beto) also lands on the list', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByRole('button', { name: new RegExp(account('beto').displayName) }).click()
  await expect(page.getByLabel(strings.list.addLabel)).toBeVisible()
  await expect(page).not.toHaveURL(/\/grupo$/)
})
