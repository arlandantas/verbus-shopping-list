import { expect, type Page } from '@playwright/test'
import { strings } from '../../../src/strings/pt-BR'
import { seedCategory } from './emulator'

/** From the list page: makes sure the category exists (groups start empty, S-092), then opens the edit sheet, picks it and saves. */
export async function setItemCategory(page: Page, itemName: string, label: string) {
  await seedCategory(label)
  await page.getByRole('button', { name: strings.list.edit(itemName) }).click()
  await page.getByRole('combobox', { name: strings.item.category }).selectOption({ label })
  await page.getByRole('button', { name: strings.item.save }).click()
  await expect(page).toHaveURL(/\/$/)
}
