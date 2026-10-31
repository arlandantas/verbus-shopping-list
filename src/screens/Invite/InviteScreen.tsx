import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { clearReturnTo } from '@/app/returnTo'
import { useFamily } from '@/app/FamilyProvider'
import {
  AlreadyInFamily,
  InviteNotFound,
  getInvitePreview,
  joinFamilyByCode,
} from '@/data/families'
import { strings } from '@/strings/pt-BR'

type Preview =
  | { state: 'loading' }
  | { state: 'notFound' }
  | { state: 'error' }
  | { state: 'ready'; familyName: string }

// FamilyRoutes unmounts its routes while the new family loads, which would reset component
// state and flash the "already in a family" notice; the pending-join flag survives that remount.
let joinPending = false

const button = 'min-h-12 w-full rounded px-4 text-base font-medium'

/** /convite/:code — confirm joining the family named in the invite (ADR-0007). */
export function InviteScreen() {
  const { code = '' } = useParams()
  const family = useFamily()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<Preview>({ state: 'loading' })
  const [joined, setJoined] = useState(joinPending)
  const [busy, setBusy] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const alreadyInFamily = family.status === 'ready' && !joined

  useEffect(() => clearReturnTo(), [])

  useEffect(() => {
    if (family.status !== 'none') return
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
    if (joined && family.status === 'ready') {
      joinPending = false
      void navigate('/', { replace: true })
    }
  }, [joined, family.status, navigate])

  async function confirm() {
    setBusy(true)
    setJoinError(null)
    joinPending = true // before the write: the optimistic profile update flips family.status first
    setJoined(true)
    try {
      await joinFamilyByCode(code)
    } catch (e) {
      joinPending = false
      setJoined(false)
      if (e instanceof InviteNotFound) setPreview({ state: 'notFound' })
      else
        setJoinError(
          e instanceof AlreadyInFamily ? strings.invite.alreadyInFamily : strings.invite.error,
        )
    } finally {
      setBusy(false)
    }
  }

  let body: ReactNode
  if (alreadyInFamily) {
    body = <p role="alert">{strings.invite.alreadyInFamily}</p>
  } else if (preview.state === 'notFound') {
    body = <p role="alert">{strings.invite.notFound}</p>
  } else if (preview.state === 'error') {
    body = <p role="alert">{strings.invite.error}</p>
  } else if (preview.state === 'loading' || family.status === 'loading' || joined) {
    body = <p>{strings.loading}</p>
  } else {
    body = (
      <>
        <h1 className="min-h-12 text-xl">{strings.invite.title(preview.familyName)}</h1>
        {joinError && (
          <p role="alert" className="text-red-700">
            {joinError}
          </p>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
          className={`${button} bg-green-700 text-white disabled:opacity-50`}
        >
          {busy ? strings.invite.confirming : strings.invite.confirm}
        </button>
      </>
    )
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-4">
      {body}
      <button
        type="button"
        onClick={() => void navigate('/', { replace: true })}
        className={`${button} bg-gray-200`}
      >
        {strings.invite.back}
      </button>
    </main>
  )
}
