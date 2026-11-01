import { useEffect, useState } from 'react'
import type { Purchase, PurchaseLine } from '@/data/converters'
import { watchCycleLines, watchPurchases } from '@/data/history'

/** Family purchases, newest first (null until the first snapshot). */
export function usePurchases(familyId: string | undefined): Purchase[] | null {
  const [state, setState] = useState<{ key: string; list: Purchase[] } | null>(null)
  useEffect(() => {
    if (!familyId) return
    return watchPurchases(familyId, (list) => setState({ key: familyId, list }))
  }, [familyId])
  return state && state.key === familyId ? state.list : null
}

/** Purchase lines of one cycle (null until the first snapshot). */
export function useCycleLines(
  familyId: string | undefined,
  cycle: string | undefined,
): PurchaseLine[] | null {
  const [state, setState] = useState<{ key: string; list: PurchaseLine[] } | null>(null)
  const key = `${familyId}/${cycle}`
  useEffect(() => {
    if (!familyId || !cycle) return
    return watchCycleLines(familyId, cycle, (list) => setState({ key, list }))
  }, [familyId, cycle, key])
  return familyId && cycle && state && state.key === key ? state.list : null
}
