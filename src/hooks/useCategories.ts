import { useEffect, useState } from 'react'
import { watchCategories } from '@/data/categories'
import type { Category } from '@/data/converters'

/** Family categories ordered (null until the first snapshot). */
export function useCategories(familyId: string | undefined): Category[] | null {
  const [state, setState] = useState<{ familyId: string; list: Category[] } | null>(null)
  useEffect(() => {
    if (!familyId) return
    return watchCategories(familyId, (list) => setState({ familyId, list }))
  }, [familyId])
  return state && state.familyId === familyId ? state.list : null
}
