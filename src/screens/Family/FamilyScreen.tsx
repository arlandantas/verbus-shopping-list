import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { signOut } from '@/data/auth'
import { MAX_GROUPS_PER_USER, setRecurringEnabled } from '@/data/families'
import { Dialog } from '@/components/m3/Dialog'
import { Button } from '@/components/m3/Button'
import { Icon } from '@/components/m3/Icon'
import { IconButton } from '@/components/m3/IconButton'
import { ListItem } from '@/components/m3/ListItem'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { useMemberNames } from '@/hooks/useMemberNames'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'
import { fireAndForget } from '@/data/writeErrors'
import { RecurringToggle } from './RecurringToggle'
import { InviteCard } from './InviteCard'
import { CreateForm } from './CreateForm'
import { JoinForm } from './JoinForm'
import '../auth.css'

export function FamilyScreen() {
  const family = useFamily()
  const navigate = useNavigate()
  const location = useLocation()
  const atLimit = family.groups.length >= MAX_GROUPS_PER_USER
  const done = (id: string) => {
    family.setActiveGroup(id)
    void navigate('/')
  }
  const [action, setAction] = useState<'create' | 'join' | null>(() => {
    const a = (location.state as { action?: unknown } | null)?.action
    return a === 'create' || a === 'join' ? a : null
  })
  const [confirmOut, setConfirmOut] = useState(false)
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
        <RecurringToggle
          checked={family.family.recurringEnabled}
          onChange={(v) => fireAndForget(setRecurringEnabled(family.family.id, v))}
        />
        <ul className="family-list">
          <ListItem
            leading={<Icon name="category" />}
            headline={strings.categories.link}
            trailing={<Icon name="chevron_right" />}
            to="/categorias"
          />
        </ul>
        {atLimit && (
          <p role="alert" className="auth-error">
            {strings.invite.groupLimit}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button
            variant="tonal"
            disabled={atLimit}
            onClick={() => setAction(action === 'create' ? null : 'create')}
          >
            {strings.groups.createNew}
          </Button>
          <Button
            variant="tonal"
            disabled={atLimit}
            onClick={() => setAction(action === 'join' ? null : 'join')}
          >
            {strings.groups.joinAnother}
          </Button>
        </div>
        {!atLimit && action === 'create' && <CreateForm onCreated={done} />}
        {!atLimit && action === 'join' && <JoinForm onJoined={done} />}
      </>
    )
  } else {
    body = (
      <>
        <CreateForm />
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
