import { devices, expect, type Browser, type Page } from '@playwright/test'
import { strings } from '../../../src/strings/pt-BR'

const AUTH_KEY = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake'

async function newMember(browser: Browser, email: string, displayName: string): Promise<Page> {
  const res = await fetch(AUTH_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret123', displayName, returnSecureToken: true }),
  })
  if (!res.ok) throw new Error(`signUp failed: ${res.status}`)
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    baseURL: 'http://127.0.0.1:4173',
  })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill(email)
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signIn, exact: true }).click()
  return page
}

/** Ana creates "Casa" with the given items; Beto joins. Each has its own browser context. */
export async function twoMembers(browser: Browser, items: string[]) {
  const ana = await newMember(browser, 'ana@example.com', 'Ana')
  await expect(ana).toHaveURL(/\/familia$/)
  await ana.getByLabel(strings.family.nameLabel).fill('Casa')
  await ana.getByRole('button', { name: strings.family.create }).click()
  const code = (await ana.getByTestId('invite-code').textContent()) ?? ''
  await ana.getByRole('button', { name: strings.family.continue }).click()
  const field = ana.getByLabel(strings.list.addLabel)
  for (const name of items) {
    await field.fill(name)
    await field.press('Enter')
    await expect(ana.getByRole('listitem').filter({ hasText: name })).toBeVisible()
  }
  await ana.waitForTimeout(1500) // let the item writes reach the emulator
  const beto = await newMember(browser, 'beto@example.com', 'Beto')
  await expect(beto).toHaveURL(/\/familia$/)
  await beto.getByLabel(strings.family.join.codeLabel).fill(code)
  await beto.getByRole('button', { name: strings.family.join.submit }).click()
  await expect(beto.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await beto.goto('/')
  await expect(beto.getByLabel(strings.list.addLabel)).toBeVisible()
  for (const p of [ana, beto]) {
    await p.getByRole('link', { name: strings.market.enter }).click()
    await expect(p).toHaveURL(/\/mercado$/)
  }
  return { ana, beto }
}
