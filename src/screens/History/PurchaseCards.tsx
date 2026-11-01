import type { PurchaseLine } from '@/data/converters'
import { groupByPurchase } from '@/domain/history'
import { formatBRL } from '@/domain/price'
import { strings } from '@/strings/pt-BR'
import { LineRow } from './LineRow'

const parts = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

/** "sáb, 14 de nov" */
export function formatPurchaseDay(d: Date): string {
  const p = Object.fromEntries(
    parts.formatToParts(d).map((x) => [x.type, x.value.replace('.', '')]),
  )
  return `${p.weekday}, ${p.day} de ${p.month}`
}

interface Props {
  lines: PurchaseLine[]
  purchases: { id: string; market: string | null; purchasedAt: Date }[]
  pendingKeys: Set<string>
  onAdd: (line: PurchaseLine) => void
  onEdit: (line: PurchaseLine) => void
}

export function PurchaseCards({ lines, purchases, pendingKeys, onAdd, onEdit }: Props) {
  const groups = groupByPurchase(lines, purchases)
  return (
    <>
      {groups.map((g) => {
        const title = g.purchasedAt
          ? formatPurchaseDay(g.purchasedAt)
          : strings.history.unknownPurchase
        return (
          <section
            key={g.id ?? 'unknown'}
            aria-label={`${title}${g.purchasedAt ? ` · ${g.market ?? strings.history.noMarket}` : ''}`}
            className="history-summary"
          >
            <p className="history-summary__total">
              <span>{title}</span>
              <span>
                {g.totalCents === null ? strings.history.noValues : formatBRL(g.totalCents)}
              </span>
            </p>
            {g.purchasedAt && (
              <p className="history-summary__note">{g.market ?? strings.history.noMarket}</p>
            )}
            <ul className="history-list">
              {g.lines.map((l) => (
                <LineRow
                  key={l.id}
                  line={l}
                  pending={pendingKeys.has(l.nameKey)}
                  onAdd={onAdd}
                  onEdit={onEdit}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
