import { useState } from 'react'
import { TEST_ACCOUNTS } from '../../../scripts/seed/accounts.ts'
import { authErrorMessage, signInWithEmail } from '@/data/auth'
import { Button } from '@/components/m3/Button'
import { devStrings } from '@/strings/pt-BR'
import '../auth.css'

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
    <section aria-label={devStrings.testAccounts} className="auth-form">
      <h2 className="auth-heading">{devStrings.testAccounts}</h2>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      {TEST_ACCOUNTS.map((a) => (
        <Button
          key={a.key}
          variant="tonal"
          disabled={busy}
          onClick={() => void login(a.email, a.password)}
        >
          {a.displayName} — {a.hint}
        </Button>
      ))}
    </section>
  )
}
