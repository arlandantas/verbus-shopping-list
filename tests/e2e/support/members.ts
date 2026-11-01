import { devices, expect, type Browser, type Page } from '@playwright/test'
import { strings } from '../../../src/strings/pt-BR'
import { waitForItemCount } from './emulator'

const AUTH_KEY = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake'

export async function newMember(
  browser: Browser,
  email: string,
  displayName: string,
  now?: Date,
): Promise<Page> {
  const res = await fetch(AUTH_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret123', displayName, returnSecureToken: true }),
  })
  if (!res.ok) throw new Error(`signUp failed: ${res.status}`)
  return signIn(browser, email, now)
}

/** New browser context (optionally with a fixed clock; timers stay real) signed in as an existing user. */
export async function signIn(browser: Browser, email: string, now?: Date): Promise<Page> {
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    baseURL: 'http://127.0.0.1:4173',
  })
  if (now) await context.clock.setFixedTime(now)
  const page = await context.newPage()
  await page.goto('/')
  await page.getByLabel(strings.login.email).fill(email)
  await page.getByLabel(strings.login.password).fill('secret123')
  await page.getByRole('button', { name: strings.login.signIn, exact: true }).click()
  return page
}

/** Ana creates "Casa" with the given items; Beto joins. Each has its own browser context. */
export async function twoMembers(browser: Browser, items: string[], now?: Date) {
  const ana = await newMember(browser, 'ana@example.com', 'Ana', now)
  await expect(ana).toHaveURL(/\/grupo$/)
  await ana.getByLabel(strings.family.nameLabel).fill('Casa')
  await ana.getByRole('button', { name: strings.family.create }).click()
  const code = (await ana.getByTestId('invite-code').textContent()) ?? ''
  await ana
    .getByRole('navigation', { name: strings.nav.label })
    .getByRole('link', { name: strings.nav.list, exact: true })
    .click()
  const field = ana.getByLabel(strings.list.addLabel)
  for (const name of items) {
    await field.fill(name)
    await field.press('Enter')
    await expect(ana.getByRole('listitem').filter({ hasText: name })).toBeVisible()
  }
  await waitForItemCount(items.length) // item writes reached the emulator
  const beto = await newMember(browser, 'beto@example.com', 'Beto', now)
  await expect(beto).toHaveURL(/\/grupo$/)
  await beto.getByLabel(strings.family.join.codeLabel).fill(code)
  await beto.getByRole('button', { name: strings.family.join.submit }).click()
  await expect(beto.getByRole('heading', { name: 'Casa' })).toBeVisible()
  await beto.goto('/')
  await expect(beto.getByLabel(strings.list.addLabel)).toBeVisible()
  return { ana, beto }
}
