import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const field = (page: Page) => page.getByLabel(strings.list.addLabel)
const row = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name })

async function setupFamily(page: Page) {
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill('ana@example.com')
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await page.getByLabel(strings.family.nameLabel).fill('Casa')
  await page.getByRole('button', { name: strings.family.create }).click()
  await expect(page.getByTestId('invite-code')).toBeVisible()
  await page
    .getByRole('navigation', { name: strings.nav.label })
    .getByRole('link', { name: strings.nav.list, exact: true })
    .click()
  await expect(field(page)).toBeVisible()
}

test('S-093 AC12: pasted list previews 3 rows and adds them at once, also offline', async ({
  page,
  context,
}) => {
  await setupFamily(page)
  await context.setOffline(true)
  await field(page).focus()
  await field(page).evaluate((el) => {
    const data = new DataTransfer()
    data.setData('text/plain', '- arroz\n- 2 kg feijão\n\n- arroz\n[ ] leite')
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    )
  })
  const sheet = page.getByRole('dialog', { name: strings.list.paste.title })
  await expect(sheet.getByRole('checkbox')).toHaveCount(3)
  await expect(field(page)).toHaveValue('')
  await sheet.getByRole('button', { name: strings.list.paste.confirm(3) }).click()
  await expect(page.getByText(strings.list.paste.added(3))).toBeVisible()
  await expect(row(page, 'arroz')).toBeVisible()
  await expect(row(page, 'feijão')).toContainText('2 kg')
  await expect(row(page, 'leite')).toBeVisible()
  await expect(field(page)).toBeFocused()
})
