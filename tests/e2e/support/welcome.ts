import { expect, type Page } from '@playwright/test'
import { strings } from '../../../src/strings/pt-BR'

/** Dismisses the S-110 welcome steps and, when offered, the S-111 suggestion ("Começar vazia"). */
export async function skipWelcome(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/boas-vindas$/)
  await page.getByRole('button', { name: strings.welcome.skip }).click()
  const empty = page.getByRole('button', { name: strings.suggest.empty })
  await Promise.race([empty.waitFor(), page.waitForURL(/\/$/)])
  if (await empty.isVisible()) await empty.click()
  await expect(page).toHaveURL(/\/$/)
}
