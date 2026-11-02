import { lazy, Suspense, useState, type FormEvent } from 'react'
import { Button } from '@/components/m3/Button'
import { InstallHint } from '@/components/InstallHint'
import { TextField } from '@/components/m3/TextField'
import { authErrorMessage, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/data/auth'
import { strings } from '@/strings/pt-BR'
import '../auth.css'

// Dev-only quick login (S-050): the literal env check lets the production build drop the panel.
const loadPanel =
  import.meta.env.VITE_USE_EMULATOR === 'true'
    ? () => import('./TestAccountsPanel').then((m) => ({ default: m.TestAccountsPanel }))
    : null
const TestAccountsPanel = loadPanel ? lazy(loadPanel) : null

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void run(() => signInWithEmail(email, password))
  }

  return (
    <main className="auth-page">
      <InstallHint />
      <h1 className="auth-title">{strings.appTitle}</h1>
      <form onSubmit={onSubmit} className="auth-form">
        <TextField
          label={strings.login.email}
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label={strings.login.password}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {strings.login.signIn}
        </Button>
        <Button
          variant="outlined"
          disabled={busy}
          onClick={() => void run(() => signUpWithEmail(email, password))}
        >
          {strings.login.signUp}
        </Button>
      </form>
      <Button variant="outlined" disabled={busy} onClick={() => void run(signInWithGoogle)}>
        {strings.login.google}
      </Button>
      {TestAccountsPanel && (
        <Suspense fallback={null}>
          <TestAccountsPanel />
        </Suspense>
      )}
    </main>
  )
}
