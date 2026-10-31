import { useState, type FormEvent } from 'react'
import { authErrorMessage, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/data/auth'
import { strings } from '@/strings/pt-BR'

const field = 'min-h-12 w-full rounded border border-gray-400 px-3 text-base'
const button = 'min-h-12 w-full rounded px-4 text-base font-medium'

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
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-4">
      <h1 className="min-h-12 text-2xl">{strings.appTitle}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          {strings.login.email}
          <input
            type="email"
            name="email"
            autoComplete="email"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          {strings.login.password}
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`${button} bg-green-700 text-white`}>
          {strings.login.signIn}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => signUpWithEmail(email, password))}
          className={`${button} border border-green-700 text-green-800`}
        >
          {strings.login.signUp}
        </button>
      </form>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run(signInWithGoogle)}
        className={`${button} border border-gray-500`}
      >
        {strings.login.google}
      </button>
    </main>
  )
}
