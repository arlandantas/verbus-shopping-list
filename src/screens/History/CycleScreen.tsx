import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { addItem } from '@/data/items'
import type { PurchaseLine } from '@/data/converters'
import { useCategories } from '@/hooks/useCategories'
import { useCatalog } from '@/screens/List/useCatalog'
import { useItems } from '@/screens/List/useItems'
import { updatePurchaseLine } from '@/data/history'
import { EditLineSheet } from './EditLineSheet'
import { LineRow } from './LineRow'
import { PurchaseCards } from './PurchaseCards'
import { useHistoryGroup } from './useHistoryGroup'
import { SegmentedButton } from '@/components/m3/SegmentedButton'
import { useCycleLines, usePurchases } from '@/hooks/useHistory'
import { isCycle, formatCycle } from '@/domain/cycle'
import { sumByCategory } from '@/domain/categories'
import { cycleTotalCents } from '@/domain/history'
import { formatBRL } from '@/domain/price'
import { BackButton } from '@/components/BackButton'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { ListItem } from '@/components/m3/ListItem'
import { Snackbar } from '@/components/m3/Snackbar'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'
import './history.css'

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
  const [group, setGroup] = useHistoryGroup()
  const [editing, setEditing] = useState<PurchaseLine | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const readd = (l: PurchaseLine) => {
    if (!family) return
    addItem(family.id, {
      name: l.name,
      quantity: l.quantity,
      unit: l.unit,
      categoryId: categories?.some((c) => c.id === l.categoryId) ? l.categoryId : null,
      recurring: catalog.find((c) => c.nameKey === l.nameKey)?.recurring ?? false,
    })
    setToast(strings.history.readded(l.name))
  }
  const mine = useMemo(() => (purchases ?? []).filter((p) => p.cycle === cycle), [purchases, cycle])
  const sums = useMemo(() => sumByCategory(lines ?? []), [lines])
  if (!valid) return <Navigate to="/historico" replace />
  if (!family) return null

  const byPurchase = group === 'purchase'
  const groups = sums.rows.map((r) => ({
    name: r.name,
    lines: (lines ?? []).filter((l) => (l.categoryName ?? strings.noCategory) === r.name),
  }))
  const loaded = purchases !== null && lines !== null

  return (
    <main className="history mx-auto max-w-md pb-4">
      <TopAppBar title={formatCycle(cycle)} navigation={<BackButton to="/historico" />} />
      {!loaded && <Loading />}
      {loaded && mine.length === 0 && lines.length === 0 && (
        <p className="history-empty">{strings.history.cycleEmpty}</p>
      )}
      {loaded && lines.length > 0 && (
        <SegmentedButton
          label={strings.history.groupLabel}
          value={group}
          onChange={setGroup}
          options={[
            { value: 'category', label: strings.history.byCategory },
            { value: 'purchase', label: strings.history.byPurchase },
          ]}
        />
      )}
      {loaded && lines.length > 0 && byPurchase && (
        <p className="history-month-total">
          <span>{strings.history.total}</span>
          <span>{formatBRL(cycleTotalCents(lines))}</span>
        </p>
      )}
      {loaded && lines.length > 0 && byPurchase && (
        <PurchaseCards
          lines={lines}
          purchases={mine}
          pendingKeys={pendingKeys}
          onAdd={readd}
          onEdit={setEditing}
        />
      )}
      {loaded && lines.length > 0 && !byPurchase && (
        <section aria-label={strings.history.categorySumTitle} className="history-summary">
          <p className="history-summary__total">
            <span>{strings.history.total}</span>
            <span>{formatBRL(cycleTotalCents(lines))}</span>
          </p>
          <ul className="history-summary__rows">
            {sums.rows.map((r) => (
              <li key={r.name}>
                <span>{r.name}</span>
                <span>{formatBRL(r.totalCents)}</span>
              </li>
            ))}
          </ul>
          {sums.unpricedCount > 0 && (
            <p className="history-summary__note">{strings.history.unpriced(sums.unpricedCount)}</p>
          )}
        </section>
      )}
      {loaded && mine.length > 0 && !byPurchase && (
        <section aria-label={strings.history.purchasesTitle}>
          <h2 className="history-heading">{strings.history.purchasesTitle}</h2>
          <ul aria-label={strings.history.purchasesLabel} className="history-list">
            {mine.map((p) => (
              <ListItem
                key={p.id}
                headline={p.market ?? strings.history.noMarket}
                trailing={dayMonth(p.purchasedAt)}
              />
            ))}
          </ul>
        </section>
      )}
      {!byPurchase &&
        groups.map((g) => (
          <section key={g.name} aria-label={g.name}>
            <h2 className="history-heading">{g.name}</h2>
            <ul className="history-list">
              {g.lines.map((l) => (
                <LineRow key={l.id} line={l} pending={pendingKeys.has(l.nameKey)} onAdd={readd} />
              ))}
            </ul>
          </section>
        ))}
      {editing && (
        <EditLineSheet
          line={editing}
          purchase={mine.find((p) => p.id === editing.purchaseId)}
          onSave={(patch) => updatePurchaseLine(family.id, editing, patch, lines ?? [])}
          onClose={() => setEditing(null)}
        />
      )}
      {toast && <Snackbar message={toast} onDismiss={() => setToast(null)} />}
    </main>
  )
}
