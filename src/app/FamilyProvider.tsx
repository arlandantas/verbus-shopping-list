import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/app/AuthProvider'
import type { Family, UserProfile } from '@/data/converters'
import { openCycleIfNeeded } from '@/data/cycles'
import { watchMyGroups } from '@/data/families'
import { ensureMemberProfile } from '@/data/members'
import { watchUser } from '@/data/users'
import { reportWriteError } from '@/data/writeErrors'
import { cycleOf } from '@/domain/cycle'

export type FamilyState = {
  /** How many recurring items the month turn just returned (ADR-0013); 0 when none or dismissed. */
  recurringAdded: number
  dismissRecurringNotice: () => void
  /** All groups the user belongs to, oldest first (ADR-0024). */
  groups: Family[]
  /** Switches the active group and remembers it on this device. */
  setActiveGroup: (id: string) => void
} & (
  | { status: 'loading'; family: null }
  | { status: 'none'; family: null }
  | { status: 'ready'; family: Family }
  | { status: 'error'; family: null; retry: () => void }
)

const NO_NOTICE = {
  recurringAdded: 0,
  dismissRecurringNotice: () => undefined,
  groups: [] as Family[],
  setActiveGroup: () => undefined,
}
const LOADING: FamilyState = { ...NO_NOTICE, status: 'loading', family: null }
const FamilyContext = createContext<FamilyState>(LOADING)

const storageKey = (uid: string) => `activeGroup:${uid}`
function readStored(uid: string | undefined): string | null {
  if (!uid) return null
  try {
    return localStorage.getItem(storageKey(uid))
  } catch {
    return null
  }
}

/** Resolves the signed-in user's active group among watchMyGroups (ADR-0024). Mount only when signed in. */
export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined)
  const [groups, setGroups] = useState<Family[] | undefined>(undefined)
  const [preferred, setPreferred] = useState<string | null>(() => readStored(uid))
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [recurringAdded, setRecurringAdded] = useState(0)
  const ensured = useRef(new Set<string>())
  const opened = useRef(new Set<string>())

  useEffect(() => {
    if (!uid) return
    return watchUser(uid, setProfile)
  }, [uid])

  useEffect(() => {
    if (!uid) return
    return watchMyGroups(uid, setGroups, () => setFailed(true))
  }, [uid, attempt])

  const displayName = profile?.displayName ?? ''
  const resolved = groups && profile ? groups : undefined
  const active =
    resolved &&
    (resolved.find((g) => g.id === preferred) ??
      resolved.find((g) => g.id === profile?.familyId) ??
      resolved[0] ??
      null)
  const activeId = active?.id

  useEffect(() => {
    if (!uid || !activeId || !displayName || ensured.current.has(`${uid}/${activeId}`)) return
    ensured.current.add(`${uid}/${activeId}`)
    void ensureMemberProfile(activeId, uid, displayName)
  }, [uid, activeId, displayName])

  // ADR-0013: first online open of the month returns the recurring items (once per group per session, plus on reconnect).
  useEffect(() => {
    if (!uid || !activeId) return
    let current = true
    const open = () => {
      openCycleIfNeeded(activeId, cycleOf(new Date()))
        .then((r) => {
          if (current && r.added > 0) setRecurringAdded(r.added)
        })
        .catch(reportWriteError)
    }
    if (!opened.current.has(`${uid}/${activeId}`)) {
      opened.current.add(`${uid}/${activeId}`)
      open()
    }
    window.addEventListener('online', open)
    return () => {
      current = false
      window.removeEventListener('online', open)
    }
  }, [uid, activeId])

  const retry = () => {
    setFailed(false)
    setAttempt((n) => n + 1)
  }
  const setActiveGroup = (id: string) => {
    if (id === activeId) return
    setRecurringAdded(0)
    setPreferred(id)
    if (uid) {
      try {
        localStorage.setItem(storageKey(uid), id)
      } catch {
        // storage unavailable: the choice lasts for this session only
      }
    }
  }

  const common = {
    recurringAdded,
    dismissRecurringNotice: () => setRecurringAdded(0),
    groups: resolved ?? [],
    setActiveGroup,
  }
  let state: FamilyState = LOADING
  if (active === null) state = { ...common, status: 'none', family: null }
  else if (active) state = { ...common, status: 'ready', family: active }
  else if (failed) state = { ...common, status: 'error', family: null, retry }
  return <FamilyContext.Provider value={state}>{children}</FamilyContext.Provider>
}

export function useFamily(): FamilyState {
  return useContext(FamilyContext)
}
