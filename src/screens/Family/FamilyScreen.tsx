import { useState, type FormEvent } from 'react'
import { useFamily } from '@/app/FamilyProvider'
import { signOut } from '@/data/auth'
import { createFamily } from '@/data/families'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Dialog } from '@/components/m3/Dialog'
import { Button } from '@/components/m3/Button'
import { Icon } from '@/components/m3/Icon'
import { IconButton } from '@/components/m3/IconButton'
import { ListItem } from '@/components/m3/ListItem'
import { TextField } from '@/components/m3/TextField'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { useMemberNames } from '@/hooks/useMemberNames'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'
import { InviteCard } from './InviteCard'
import { JoinForm } from './JoinForm'
import '../auth.css'

export function FamilyScreen() {
  const family = useFamily()
  const online = useOnlineStatus()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = strings.family
  const names = useMemberNames(family.status === 'ready' ? family.family.id : undefined)

  /** Closes the dialog and signs out only after its history entry unwinds, else the login redirect gets undone. */
  function confirmSignOut() {
    let done = false
    const run = () => {
      if (done) return
      done = true
      window.removeEventListener('popstate', run)
      void signOut()
    }
    window.addEventListener('popstate', run)
    setTimeout(run, 500) // fallback if no history entry was unwound
    setConfirmOut(false)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !online) return
    setBusy(true)
    setError(null)
    try {
      await createFamily(trimmed) // the family snapshot switches the screen to the invite view
    } catch {
      setError(t.createError)
    } finally {
      setBusy(false)
    }
  }

  let body
  if (family.status === 'loading') {
    body = <Loading />
  } else if (family.status === 'ready') {
    body = (
      <>
        <InviteCard
          familyId={family.family.id}
          code={family.family.inviteCode}
          familyName={family.family.name}
        />
        <h2 className="auth-heading">{t.members(family.family.members.length)}</h2>
        <ul aria-label={t.membersSection} className="family-list">
          {family.family.members.map((uid) => (
            <ListItem
              key={uid}
              leading={<Icon name="group" />}
              headline={names?.[uid] || t.memberFallback}
            />
          ))}
        </ul>
        <ul className="family-list">
          <ListItem
            leading={<Icon name="category" />}
            headline={strings.categories.link}
            trailing={<Icon name="chevron_right" />}
            to="/categorias"
          />
        </ul>
      </>
    )
  } else {
    body = (
      <>
        <form onSubmit={(e) => void onSubmit(e)} className="auth-form">
          <TextField
            label={t.nameLabel}
            name="familyName"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
        <JoinForm />
      </>
    )
  }

  return (
    <main className="mx-auto max-w-sm">
      <TopAppBar
        title={family.status === 'ready' ? family.family.name : t.title}
        actions={
          <IconButton
            icon="logout"
            label={strings.login.signOut}
            onClick={() => setConfirmOut(true)}
          />
        }
      />
      <div className="flex flex-col gap-4 p-4">{body}</div>
      {confirmOut && (
        <Dialog
          open
          variant="confirm"
          title={strings.login.signOutTitle}
          confirmLabel={strings.login.signOut}
          cancelLabel={strings.login.signOutCancel}
          onClose={() => setConfirmOut(false)}
          onConfirm={confirmSignOut}
        >
          {strings.login.signOutNote}
        </Dialog>
      )}
    </main>
  )
}
