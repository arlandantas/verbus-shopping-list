import { useState, type FormEvent } from 'react'
import { Button } from '@/components/m3/Button'
import { TextField } from '@/components/m3/TextField'
import { AlreadyMember, GroupLimitReached, InviteNotFound, joinFamilyByCode } from '@/data/families'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { strings } from '@/strings/pt-BR'
import '../auth.css'

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
      else if (err instanceof AlreadyMember) setError(strings.invite.alreadyInFamily)
      else if (err instanceof GroupLimitReached) setError(strings.invite.groupLimit)
      else setError(t.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="auth-form">
      <h2 className="auth-heading">{t.title}</h2>
      <TextField
        label={t.codeLabel}
        name="inviteCode"
        autoCapitalize="characters"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {!online && <p className="auth-warning">{t.offlineWarning}</p>}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <Button type="submit" variant="outlined" disabled={busy || !online || !code.trim()}>
        {busy ? t.submitting : t.submit}
      </Button>
    </form>
  )
}
