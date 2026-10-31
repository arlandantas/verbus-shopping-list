import { useEffect, useState } from 'react'
import { watchCatalog } from '@/data/catalog'
import type { CatalogEntry } from '@/data/converters'
import { reportWriteError } from '@/data/writeErrors'

/** Live family catalog (cache-backed, so suggestions work offline). */
export function useCatalog(familyId: string): CatalogEntry[] {
  const [state, setState] = useState<{ familyId: string; entries: CatalogEntry[] } | null>(null)
  useEffect(
    () => watchCatalog(familyId, (entries) => setState({ familyId, entries }), reportWriteError),
    [familyId],
  )
  return state?.familyId === familyId ? state.entries : []
}
