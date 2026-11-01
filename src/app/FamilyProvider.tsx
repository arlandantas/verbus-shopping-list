import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/app/AuthProvider'
import type { Family } from '@/data/converters'
import { openCycleIfNeeded } from '@/data/cycles'
import { watchFamily } from '@/data/families'
import { ensureMemberProfile } from '@/data/members'
import { watchUser } from '@/data/users'
import { reportWriteError } from '@/data/writeErrors'
import { cycleOf } from '@/domain/cycle'

export type FamilyState = {
  /** How many recurring items the month turn just returned (ADR-0013); 0 when none or dismissed. */
  recurringAdded: number
  dismissRecurringNotice: () => void
} & (
  | { status: 'loading'; family: null }
  | { status: 'none'; family: null }
  | { status: 'ready'; family: Family }
  | { status: 'error'; family: null; retry: () => void }
)

const NO_NOTICE = { recurringAdded: 0, dismissRecurringNotice: () => undefined }
const LOADING: FamilyState = { ...NO_NOTICE, status: 'loading', family: null }
const FamilyContext = createContext<FamilyState>(LOADING)

/** Resolves the signed-in user's family from users/{uid}.familyId. Mount only when signed in, keyed by uid so state resets per user. */
export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid
  const [familyId, setFamilyId] = useState<string | null | undefined>(undefined)
  const [displayName, setDisplayName] = useState('')
  const [family, setFamily] = useState<Family | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [recurringAdded, setRecurringAdded] = useState(0)

  useEffect(() => {
    if (!uid) return
    return watchUser(uid, (profile) => {
      setFamilyId(profile ? profile.familyId : undefined)
      setDisplayName(profile?.displayName ?? '')
    })
  }, [uid])

  useEffect(() => {
    if (!familyId) return
    return watchFamily(familyId, setFamily, () => setFailed(true))
  }, [familyId, attempt])

  const readyFamilyId = familyId && family?.id === familyId ? familyId : undefined
  useEffect(() => {
    if (uid && readyFamilyId && displayName)
      void ensureMemberProfile(readyFamilyId, uid, displayName)
  }, [uid, readyFamilyId, displayName])

  // ADR-0013: first online open of the month returns the recurring items (background, once per family).
  useEffect(() => {
    if (!uid || !readyFamilyId) return
    const open = () => {
      openCycleIfNeeded(readyFamilyId, cycleOf(new Date()))
        .then((r) => {
          if (r.added > 0) setRecurringAdded(r.added)
        })
        .catch(reportWriteError)
    }
    open()
    window.addEventListener('online', open)
    return () => window.removeEventListener('online', open)
  }, [uid, readyFamilyId])

  const retry = () => {
    setFailed(false)
    setAttempt((n) => n + 1)
  }

  const notice = { recurringAdded, dismissRecurringNotice: () => setRecurringAdded(0) }
  let state: FamilyState = LOADING
  if (familyId === null) state = { ...notice, status: 'none', family: null }
  else if (familyId && family?.id === familyId) state = { ...notice, status: 'ready', family }
  else if (familyId && failed) state = { ...notice, status: 'error', family: null, retry }
  return <FamilyContext.Provider value={state}>{children}</FamilyContext.Provider>
}

export function useFamily(): FamilyState {
  return useContext(FamilyContext)
}
