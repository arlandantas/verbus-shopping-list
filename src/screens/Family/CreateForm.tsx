import { useState, type FormEvent } from 'react'
import { Button } from '@/components/m3/Button'
import { TextField } from '@/components/m3/TextField'
import { GroupLimitReached, createFamily } from '@/data/families'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { strings } from '@/strings/pt-BR'
import { RecurringToggle } from './RecurringToggle'
import '../auth.css'

/** Create a group by name. First access relies on the snapshot to switch screens; otherwise `onCreated` runs. */
export function CreateForm({ onCreated }: { onCreated?: (familyId: string) => void }) {
  const t = strings.family
  const online = useOnlineStatus()
  const [name, setName] = useState('')
  const [recurring, setRecurring] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !online) return
    setBusy(true)
    setError(null)
    try {
      const { familyId } = await createFamily(trimmed, recurring)
      onCreated?.(familyId)
    } catch (err) {
      setError(err instanceof GroupLimitReached ? strings.invite.groupLimit : t.createError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="auth-form">
      <TextField
        label={t.nameLabel}
        name="familyName"
        maxLength={60}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <RecurringToggle checked={recurring} onChange={setRecurring} />
      {!online && <p className="auth-warning">{t.offlineWarning}</p>}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !online || !name.trim()}>
        {busy ? t.creating : t.create}
      </Button>
    </form>
  )
}
