import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { formatBRL as brl } from '@/domain/price'

const formatBRL = (c: number) => brl(c).replace(/\s/g, ' ')
import { strings } from '@/strings/pt-BR'
import { HistoryScreen } from './HistoryScreen'

const h = vi.hoisted(() => ({ purchases: null as unknown[] | null }))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'f1', name: 'Casa' } }),
}))
vi.mock('@/hooks/useHistory', () => ({ usePurchases: () => h.purchases }))

const p = (cycle: string, itemCount: number, totalCents: number | null) => ({
  id: cycle + itemCount,
  cycle,
  market: null,
  itemCount,
  totalCents,
  purchasedAt: new Date(2026, 0, 1),
  hasPendingWrites: false,
})
const renderIt = () =>
  render(
    <MemoryRouter>
      <HistoryScreen />
    </MemoryRouter>,
  )

describe('S-047 AC1: HistoryScreen', () => {
  it('lists months newest first with total and item count, linking to the month', () => {
    h.purchases = [p('2026-10', 1, 500), p('2026-11', 2, 1500), p('2026-11', 1, 800)]
    renderIt()
    const items = within(
      screen.getByRole('list', { name: strings.history.monthsLabel }),
    ).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent(`novembro de 2026${formatBRL(2300)} · 3 itens`)
    expect(items[1]).toHaveTextContent(`outubro de 2026${formatBRL(500)} · 1 item`)
    expect(within(items[0]).getByRole('link')).toHaveAttribute('href', '/historico/2026-11')
    expect(items[0].querySelector('svg')).not.toBeNull()
  })

  it('AC1: top bar title and "sem valores" for months without prices', () => {
    h.purchases = [p('2026-10', 2, null)]
    renderIt()
    expect(screen.getByRole('heading', { name: strings.history.title, level: 1 })).toBeVisible()
    expect(screen.getByRole('list', { name: strings.history.monthsLabel })).toHaveTextContent(
      `${strings.history.noValues} · 2 itens`,
    )
  })

  it('shows a pt-BR message when there are no purchases', () => {
    h.purchases = []
    renderIt()
    expect(screen.getByText(strings.history.empty)).toBeInTheDocument()
  })

  it('shows nothing but the header while loading', () => {
    h.purchases = null
    renderIt()
    expect(screen.queryByText(strings.history.empty)).toBeNull()
  })
})
