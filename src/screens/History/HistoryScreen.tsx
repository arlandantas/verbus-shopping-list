import { useMemo } from 'react'
import { Icon } from '@/components/m3/Icon'
import { ListItem } from '@/components/m3/ListItem'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { useFamily } from '@/app/FamilyProvider'
import { usePurchases } from '@/hooks/useHistory'
import { cyclesFrom } from '@/domain/history'
import { formatCycle } from '@/domain/cycle'
import { formatBRL } from '@/domain/price'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'
import './history.css'

export function HistoryScreen() {
  const { family } = useFamily()
  const purchases = usePurchases(family?.id)
  const months = useMemo(() => cyclesFrom(purchases ?? []), [purchases])
  if (!family) return null

  return (
    <main className="history">
      <TopAppBar title={strings.history.title} />
      {purchases === null && <Loading />}
      {purchases !== null && months.length === 0 && (
        <p className="history-empty">{strings.history.empty}</p>
      )}
      {months.length > 0 && (
        <ul aria-label={strings.history.monthsLabel} className="history-list">
          {months.map((m) => (
            <ListItem
              key={m.cycle}
              to={`/historico/${m.cycle}`}
              headline={formatCycle(m.cycle)}
              supporting={`${m.totalCents > 0 ? formatBRL(m.totalCents) : strings.history.noValues} · ${strings.history.itemCount(m.itemCount)}`}
              trailing={<Icon name="chevron_right" />}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
