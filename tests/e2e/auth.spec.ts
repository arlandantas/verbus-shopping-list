import { devices, expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/strings/pt-BR'
import { clearEmulators } from './support/emulator'

test.use({ ...devices['Pixel 7'] })
test.beforeEach(async () => {
  await clearEmulators()
})

const FS = 'http://127.0.0.1:8080/v1/projects/demo-verbus/databases/(default)/documents/users'
const EMAIL = 'ana@example.com'
const PASSWORD = 'secret123'

async function signUp(page: Page) {
  await page.goto('/entrar')
  await page.getByLabel(strings.login.email).fill(EMAIL)
  await page.getByLabel(strings.login.password).fill(PASSWORD)
  await page.getByRole('button', { name: strings.login.signUp }).click()
  await expect(page).toHaveURL(/\/grupo$/)
}

async function userDocs(): Promise<unknown[]> {
  const res = await fetch(FS, { headers: { Authorization: 'Bearer owner' } })
  return ((await res.json()) as { documents?: unknown[] }).documents ?? []
}

test('S-010 AC1: signed-out visit to / shows the landing; its CTA leads to /entrar', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings.landing.heroTitle)
  await page.getByRole('button', { name: strings.landing.createAccount }).first().click()
  await expect(page).toHaveURL(/\/entrar$/)
})

test('S-010 AC2: e-mail sign-up lands on /grupo and creates users/{uid}', async ({ page }) => {
  await signUp(page)
  const docs = (await userDocs()) as { fields: { email: { stringValue: string } } }[]
  expect(docs).toHaveLength(1)
  expect(docs[0].fields.email.stringValue).toBe(EMAIL)
})

test('S-010 AC3: Google sign-in through the Auth emulator popup', async ({ page }) => {
  await page.goto('/entrar')
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: strings.login.google }).click()
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')
  await popup.getByText('Add new account').click()
  await popup.getByRole('button', { name: /auto-generate user information/i }).click()
  await popup.getByRole('button', { name: /sign in with google/i }).click()
  await expect(page).toHaveURL(/\/grupo$/)
  expect(await userDocs()).toHaveLength(1)
})

async function signOutConfirmed(page: Page) {
  await page.getByRole('button', { name: strings.login.signOut }).click()
  await page
    .getByRole('dialog', { name: strings.login.signOutTitle })
    .getByRole('button', { name: strings.login.signOut })
    .click()
  await expect(page).toHaveURL(/\/entrar$/)
}

test('S-010 AC4: wrong password shows a pt-BR message only', async ({ page }) => {
  await signUp(page)
  await signOutConfirmed(page)
  await page.getByLabel(strings.login.email).fill(EMAIL)
  await page.getByLabel(strings.login.password).fill('wrong-password')
  await page.getByRole('button', { name: strings.login.signIn, exact: true }).click()
  const alert = page.getByRole('alert')
  await expect(alert).toHaveText(strings.authErrors['auth/invalid-credential'])
  await expect(page.getByText(/firebase|invalid|error/i)).toHaveCount(0)
})

test('S-010 AC6: reload keeps the session; sign out returns to /entrar', async ({ page }) => {
  await signUp(page)
  await page.reload()
  await expect(page).toHaveURL(/\/grupo$/)
  await expect(page.getByRole('heading', { name: strings.family.title })).toBeVisible()
  await signOutConfirmed(page)
})

test('S-073 AC2: cancelling the sign-out dialog keeps the session', async ({ page }) => {
  await signUp(page)
  await page.getByRole('button', { name: strings.login.signOut }).click()
  const dialog = page.getByRole('dialog', { name: strings.login.signOutTitle })
  await dialog.getByRole('button', { name: strings.login.signOutCancel }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL(/\/grupo$/)
})

/** Marks the persisted Firebase ID token as expired so the next load must use the refresh token. */
async function expireStoredIdToken(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('firebaseLocalStorageDb')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const store = open.result
            .transaction('firebaseLocalStorage', 'readwrite')
            .objectStore('firebaseLocalStorage')
          const all = store.getAll()
          all.onsuccess = () => {
            for (const row of all.result as {
              fbase_key: string
              value: { stsTokenManager?: { expirationTime: number } }
            }[]) {
              if (row.value?.stsTokenManager) {
                row.value.stsTokenManager.expirationTime = 1
                store.put(row)
              }
            }
            store.transaction.oncomplete = () => resolve()
          }
        }
      }),
  )
}

test('stale session: accounts wiped server-side shows the login form, not endless loading', async ({
  page,
}) => {
  await signUp(page)
  await clearEmulators() // like restarting pnpm dev:local: the cached refresh token is now invalid
  await expireStoredIdToken(page) // a >1h-old session: the SDK must refresh, and the refresh fails
  await page.reload()
  await expect(page.getByLabel(strings.login.email)).toBeVisible({ timeout: 8000 })
  await expect(page).toHaveURL(/\/entrar/)
  await expect(page.getByText(strings.loading)).toHaveCount(0)
})
