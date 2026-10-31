import { useEffect, useState } from 'react'
import { watchMembers } from '@/data/members'

/** uid -> name map for the family (null until the first snapshot). */
export function useMemberNames(familyId: string | undefined): Record<string, string> | null {
  const [state, setState] = useState<{ familyId: string; names: Record<string, string> } | null>(
    null,
  )
  useEffect(() => {
    if (!familyId) return
    return watchMembers(familyId, (names) => setState({ familyId, names }))
  }, [familyId])
  return state && state.familyId === familyId ? state.names : null
}
