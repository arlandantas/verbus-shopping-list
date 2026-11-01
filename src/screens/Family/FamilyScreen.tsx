import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { signOut } from '@/data/auth'
import { createFamily } from '@/data/families'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { IconButton } from '@/components/m3/IconButton'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'
import { InviteCard } from './InviteCard'
import { JoinForm } from './JoinForm'

const button = 'min-h-12 w-full rounded px-4 text-base font-medium'

export function FamilyScreen() {
  const family = useFamily()
  const online = useOnlineStatus()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = strings.family

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
        <p>{t.members(family.family.members.length)}</p>
        <InviteCard code={family.family.inviteCode} familyName={family.family.name} />
        <Link to="/categorias" className={`${button} flex items-center justify-center bg-gray-200`}>
          {strings.categories.link}
        </Link>
        <button
          type="button"
          onClick={() => void navigate('/')}
          className={`${button} bg-green-700 text-white`}
        >
          {t.continue}
        </button>
      </>
    )
  } else {
    body = (
      <>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            {t.nameLabel}
            <input
              name="familyName"
              maxLength={60}
              className="min-h-12 w-full rounded border border-gray-400 px-3 text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            disabled={busy || !online || !name.trim()}
            className={`${button} bg-green-700 text-white disabled:opacity-50`}
          >
            {busy ? t.creating : t.create}
          </button>
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
          <IconButton icon="logout" label={strings.login.signOut} onClick={() => void signOut()} />
        }
      />
      <div className="flex flex-col gap-4 p-4">{body}</div>
    </main>
  )
}
