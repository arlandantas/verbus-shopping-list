import { useState, type FormEvent } from 'react'
import { cancelWelcome, requestWelcome } from '../Welcome/welcomeSeen'
import { useFamily } from '@/app/FamilyProvider'
import { Button } from '@/components/m3/Button'
import { TextField } from '@/components/m3/TextField'
import { AlreadyMember, GroupLimitReached, InviteNotFound, joinFamilyByCode } from '@/data/families'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { strings } from '@/strings/pt-BR'
import '../auth.css'

/** Join an existing family by typing the invite code; the family snapshot switches the screen. */
export function JoinForm({ onJoined }: { onJoined?: (familyId: string) => void } = {}) {
  const { setActiveGroup } = useFamily()
  const [code, setCode] = useState('')
  const online = useOnlineStatus()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const t = strings.family.join

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!code.trim() || !online) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      requestWelcome()
      const { familyId } = await joinFamilyByCode(code)
      setActiveGroup(familyId)
      onJoined?.(familyId)
    } catch (err) {
      cancelWelcome()
      if (err instanceof InviteNotFound) setError(t.notFound)
      else if (err instanceof AlreadyMember) {
        setActiveGroup(err.familyId)
        setInfo(strings.invite.alreadyMember)
        onJoined?.(err.familyId)
      } else if (err instanceof GroupLimitReached) setError(strings.invite.groupLimit)
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
      {info && (
        <p role="status" className="auth-note">
          {info}
        </p>
      )}
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
