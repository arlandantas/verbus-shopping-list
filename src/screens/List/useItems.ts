import { useEffect, useState } from 'react'
import type { Item } from '@/data/converters'
import { watchItems } from '@/data/items'
import { reportWriteError } from '@/data/writeErrors'

/** Live items of the family (local snapshot first, so offline writes show at once). */
export function useItems(familyId: string): Item[] | null {
  const [state, setState] = useState<{ familyId: string; items: Item[] } | null>(null)
  useEffect(
    () => watchItems(familyId, (items) => setState({ familyId, items }), reportWriteError),
    [familyId],
  )
  return state?.familyId === familyId ? state.items : null
}
