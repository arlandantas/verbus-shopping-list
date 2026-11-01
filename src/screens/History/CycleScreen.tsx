import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { addItem } from '@/data/items'
import type { PurchaseLine } from '@/data/converters'
import { useCategories } from '@/hooks/useCategories'
import { useCatalog } from '@/screens/List/useCatalog'
import { useItems } from '@/screens/List/useItems'
import { LineRow } from './LineRow'
import { useCycleLines, usePurchases } from '@/hooks/useHistory'
import { isCycle, formatCycle } from '@/domain/cycle'
import { sumByCategory } from '@/domain/categories'
import { cycleTotalCents } from '@/domain/history'
import { formatBRL } from '@/domain/price'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'

const dayMonth = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

export function CycleScreen() {
  const { cycle = '' } = useParams()
  const valid = isCycle(cycle)
  const { family } = useFamily()
  const purchases = usePurchases(valid ? family?.id : undefined)
  const lines = useCycleLines(family?.id, valid ? cycle : undefined)
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  const catalog = useCatalog(familyId)
  const categories = useCategories(family?.id)
  const pendingKeys = useMemo(
    () => new Set((items ?? []).filter((i) => i.status === 'pending').map((i) => i.nameKey)),
    [items],
  )
  const readd = (l: PurchaseLine) => {
    if (!family) return
    addItem(family.id, {
      name: l.name,
      quantity: l.quantity,
      unit: l.unit,
      categoryId: categories?.some((c) => c.id === l.categoryId) ? l.categoryId : null,
      recurring: catalog.find((c) => c.nameKey === l.nameKey)?.recurring ?? false,
    })
  }
  const mine = useMemo(() => (purchases ?? []).filter((p) => p.cycle === cycle), [purchases, cycle])
  const sums = useMemo(() => sumByCategory(lines ?? []), [lines])
  if (!valid) return <Navigate to="/historico" replace />
  if (!family) return null

  const groups = sums.rows.map((r) => ({
    name: r.name,
    lines: (lines ?? []).filter((l) => (l.categoryName ?? strings.noCategory) === r.name),
  }))
  const loaded = purchases !== null && lines !== null

  return (
    <main className="mx-auto max-w-md pb-4">
      <header className="flex min-h-12 items-center justify-between px-4 pt-2">
        <h1 className="text-xl">{formatCycle(cycle)}</h1>
        <Link to="/historico" className="flex min-h-12 items-center underline">
          {strings.history.backToHistory}
        </Link>
      </header>
      {!loaded && <Loading />}
      {loaded && mine.length === 0 && lines.length === 0 && (
        <p className="p-4">{strings.history.cycleEmpty}</p>
      )}
      {loaded && mine.length > 0 && (
        <section aria-label={strings.history.purchasesTitle} className="px-4">
          <h2 className="py-2 text-lg">{strings.history.purchasesTitle}</h2>
          <ul aria-label={strings.history.purchasesLabel}>
            {mine.map((p) => (
              <li key={p.id} className="flex min-h-12 items-center justify-between">
                <span>{p.market ?? strings.history.noMarket}</span>
                <span>{dayMonth(p.purchasedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {groups.map((g) => (
        <section key={g.name} aria-label={g.name} className="px-4">
          <h2 className="py-2 text-lg">{g.name}</h2>
          <ul>
            {g.lines.map((l) => (
              <LineRow key={l.id} line={l} pending={pendingKeys.has(l.nameKey)} onAdd={readd} />
            ))}
          </ul>
        </section>
      ))}
      {loaded && lines.length > 0 && (
        <section aria-label={strings.history.categorySumTitle} className="px-4">
          <h2 className="py-2 text-lg">{strings.history.categorySumTitle}</h2>
          <ul>
            {sums.rows.map((r) => (
              <li key={r.name} className="flex min-h-12 items-center justify-between">
                <span>{r.name}</span>
                <span>{formatBRL(r.totalCents)}</span>
              </li>
            ))}
          </ul>
          <p className="flex min-h-12 items-center justify-between font-medium">
            <span>{strings.history.total}</span>
            <span>{formatBRL(cycleTotalCents(lines))}</span>
          </p>
          {sums.unpricedCount > 0 && <p>{strings.history.unpriced(sums.unpricedCount)}</p>}
        </section>
      )}
    </main>
  )
}
