import { useState } from 'react'
import { TEST_ACCOUNTS } from '../../../scripts/seed/accounts.ts'
import { authErrorMessage, signInWithEmail } from '@/data/auth'
import { devStrings } from '@/strings/pt-BR'

/** Emulator-only quick login (S-050). Only imported when VITE_USE_EMULATOR === 'true'. */
export function TestAccountsPanel() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function login(email: string, password: string) {
    setBusy(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label={devStrings.testAccounts} className="flex flex-col gap-2 border-t pt-3">
      <h2 className="text-base font-medium">{devStrings.testAccounts}</h2>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {TEST_ACCOUNTS.map((a) => (
        <button
          key={a.key}
          type="button"
          disabled={busy}
          onClick={() => void login(a.email, a.password)}
          className="min-h-12 w-full rounded border border-amber-600 bg-amber-50 px-4 text-left text-base"
        >
          <span className="font-medium">{a.displayName}</span>
          <span className="text-sm text-gray-700"> — {a.hint}</span>
        </button>
      ))}
    </section>
  )
}
