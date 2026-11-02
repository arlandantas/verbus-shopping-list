import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { WELCOME_ROUTE } from '../Welcome/welcomeSeen'
import { clearReturnTo } from '@/app/returnTo'
import { useFamily } from '@/app/FamilyProvider'
import {
  AlreadyMember,
  GroupLimitReached,
  InviteNotFound,
  getInvitePreview,
  joinFamilyByCode,
} from '@/data/families'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Button } from '@/components/m3/Button'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'
import '../auth.css'

type Preview =
  | { state: 'loading' }
  | { state: 'notFound' }
  | { state: 'error' }
  | { state: 'ready'; familyName: string }

// FamilyRoutes unmounts its routes while the new family loads, which would reset component
// state and flash the "already in a family" notice; the pending-join flag survives that remount.
let joinPending = false

/** /convite/:code — confirm joining the family named in the invite (ADR-0007). */
export function InviteScreen() {
  const { code = '' } = useParams()
  const family = useFamily()
  const navigate = useNavigate()
  const online = useOnlineStatus()
  const [preview, setPreview] = useState<Preview>({ state: 'loading' })
  const [joined, setJoined] = useState(joinPending)
  const [busy, setBusy] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  useEffect(() => clearReturnTo(), [])

  useEffect(() => {
    if (family.status !== 'none' && family.status !== 'ready') return
    let cancelled = false
    getInvitePreview(code).then(
      (p) => !cancelled && setPreview({ state: 'ready', familyName: p.familyName }),
      (e: unknown) =>
        !cancelled && setPreview({ state: e instanceof InviteNotFound ? 'notFound' : 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [code, family.status])

  useEffect(() => {
    if (joined && !busy && family.status === 'ready') {
      joinPending = false
      void navigate(WELCOME_ROUTE, { replace: true })
    }
  }, [joined, busy, family.status, navigate])

  async function confirm() {
    if (!online) return
    setBusy(true)
    setJoinError(null)
    joinPending = true // before the write: the optimistic profile update flips family.status first
    setJoined(true)
    try {
      const { familyId } = await joinFamilyByCode(code)
      family.setActiveGroup(familyId)
    } catch (e) {
      if (e instanceof AlreadyMember) {
        family.setActiveGroup(e.familyId) // stays "joined": the effect below goes home on the group
        return
      }
      joinPending = false
      setJoined(false)
      if (e instanceof InviteNotFound) setPreview({ state: 'notFound' })
      else
        setJoinError(
          e instanceof GroupLimitReached ? strings.invite.groupLimit : strings.invite.error,
        )
    } finally {
      setBusy(false)
    }
  }

  let body: ReactNode
  if (preview.state === 'notFound') {
    body = (
      <p role="alert" className="auth-note">
        {strings.invite.notFound}
      </p>
    )
  } else if (preview.state === 'error') {
    body = (
      <p role="alert" className="auth-note">
        {strings.invite.error}
      </p>
    )
  } else if (preview.state === 'loading' || family.status === 'loading' || joined) {
    body = <Loading />
  } else {
    body = (
      <>
        <h1 className="auth-title">{strings.invite.title(preview.familyName)}</h1>
        {!online && <p className="auth-warning">{strings.invite.offlineWarning}</p>}
        {joinError && (
          <p role="alert" className="auth-error">
            {joinError}
          </p>
        )}
        <Button disabled={busy || !online} onClick={() => void confirm()}>
          {busy ? strings.invite.confirming : strings.invite.confirm}
        </Button>
      </>
    )
  }

  return (
    <main className="auth-page">
      {body}
      <Button variant="tonal" onClick={() => void navigate('/', { replace: true })}>
        {strings.invite.back}
      </Button>
    </main>
  )
}
