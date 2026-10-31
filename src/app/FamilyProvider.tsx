import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/app/AuthProvider'
import type { Family } from '@/data/converters'
import { watchFamily } from '@/data/families'
import { ensureMemberProfile } from '@/data/members'
import { watchUser } from '@/data/users'

export type FamilyState =
  | { status: 'loading'; family: null }
  | { status: 'none'; family: null }
  | { status: 'ready'; family: Family }
  | { status: 'error'; family: null; retry: () => void }

const LOADING: FamilyState = { status: 'loading', family: null }
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

  const retry = () => {
    setFailed(false)
    setAttempt((n) => n + 1)
  }

  let state: FamilyState = LOADING
  if (familyId === null) state = { status: 'none', family: null }
  else if (familyId && family?.id === familyId) state = { status: 'ready', family }
  else if (familyId && failed) state = { status: 'error', family: null, retry }
  return <FamilyContext.Provider value={state}>{children}</FamilyContext.Provider>
}

export function useFamily(): FamilyState {
  return useContext(FamilyContext)
}
