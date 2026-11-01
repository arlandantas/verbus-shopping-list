import { useMemo } from 'react'
import { Link } from 'react-router'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { useFamily } from '@/app/FamilyProvider'
import { usePurchases } from '@/hooks/useHistory'
import { cyclesFrom } from '@/domain/history'
import { formatCycle } from '@/domain/cycle'
import { formatBRL } from '@/domain/price'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'

export function HistoryScreen() {
  const { family } = useFamily()
  const purchases = usePurchases(family?.id)
  const months = useMemo(() => cyclesFrom(purchases ?? []), [purchases])
  if (!family) return null

  return (
    <main className="mx-auto max-w-md">
      <TopAppBar title={strings.history.title} />
      {purchases === null && <Loading />}
      {purchases !== null && months.length === 0 && <p className="p-4">{strings.history.empty}</p>}
      {months.length > 0 && (
        <ul aria-label={strings.history.monthsLabel} className="flex flex-col">
          {months.map((m) => (
            <li key={m.cycle} className="border-b">
              <Link to={`/historico/${m.cycle}`} className="flex min-h-12 items-center px-4 py-2">
                {`${formatCycle(m.cycle)} · ${formatBRL(m.totalCents)} · ${strings.history.itemCount(m.itemCount)}`}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
