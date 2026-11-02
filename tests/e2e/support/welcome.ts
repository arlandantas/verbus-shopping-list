import { expect, type Page } from '@playwright/test'
import { strings } from '../../../src/strings/pt-BR'

/** Dismisses the S-110 welcome steps shown right after creating/joining a group. */
export async function skipWelcome(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/boas-vindas$/)
  await page.getByRole('button', { name: strings.welcome.skip }).click()
  await expect(page).toHaveURL(/\/$/)
}
