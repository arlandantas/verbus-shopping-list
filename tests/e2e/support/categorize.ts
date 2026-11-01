import { expect, type Page } from '@playwright/test'
import { strings } from '../../../src/strings/pt-BR'

/** From the list page: opens the edit sheet, picks the category and saves. */
export async function setItemCategory(page: Page, itemName: string, label: string) {
  await page.getByRole('button', { name: strings.list.edit(itemName) }).click()
  await page.getByRole('combobox', { name: strings.item.category }).selectOption({ label })
  await page.getByRole('button', { name: strings.item.save }).click()
  await expect(page).toHaveURL(/\/$/)
}
