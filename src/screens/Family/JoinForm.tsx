import { useState, type FormEvent } from 'react'
import { AlreadyInFamily, InviteNotFound, joinFamilyByCode } from '@/data/families'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { strings } from '@/strings/pt-BR'

/** Join an existing family by typing the invite code; the family snapshot switches the screen. */
export function JoinForm() {
  const [code, setCode] = useState('')
  const online = useOnlineStatus()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = strings.family.join

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!code.trim() || !online) return
    setBusy(true)
    setError(null)
    try {
      await joinFamilyByCode(code)
    } catch (err) {
      if (err instanceof InviteNotFound) setError(t.notFound)
      else if (err instanceof AlreadyInFamily) setError(strings.invite.alreadyInFamily)
      else setError(t.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{t.title}</h2>
      <label className="flex flex-col gap-1">
        {t.codeLabel}
        <input
          name="inviteCode"
          autoCapitalize="characters"
          autoComplete="off"
          className="min-h-12 w-full rounded border border-gray-400 px-3 font-mono text-base uppercase"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      {!online && <p className="text-red-700">{t.offlineWarning}</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !online || !code.trim()}
        className="min-h-12 w-full rounded border border-green-700 px-4 text-base font-medium text-green-800 disabled:opacity-50"
      >
        {busy ? t.submitting : t.submit}
      </button>
    </form>
  )
}
