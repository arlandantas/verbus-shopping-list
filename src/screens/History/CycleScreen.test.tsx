import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { formatBRL as brl } from '@/domain/price'

const formatBRL = (c: number) => brl(c).replace(/\s/g, ' ')
import { strings } from '@/strings/pt-BR'
import { CycleScreen } from './CycleScreen'

const h = vi.hoisted(() => ({
  purchases: [] as unknown[] | null,
  lines: [] as unknown[] | null,
}))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'f1', name: 'Casa' } }),
}))
vi.mock('@/hooks/useHistory', () => ({
  usePurchases: () => h.purchases,
  useCycleLines: () => h.lines,
}))

const purchase = (id: string, market: string | null, day: number, cycle = '2026-11') => ({
  id,
  cycle,
  market,
  itemCount: 1,
  totalCents: null,
  purchasedAt: new Date(2026, 10, day),
  hasPendingWrites: false,
})
const line = (name: string, categoryName: string | null, priceCents: number | null) => ({
  id: name,
  name,
  categoryName,
  priceCents,
  quantity: 1,
  unit: 'un',
})

const renderIt = (path = '/historico/2026-11') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/historico" element={<p>months</p>} />
        <Route path="/historico/:cycle" element={<CycleScreen />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  h.purchases = [
    purchase('a', 'Atacadão', 5),
    purchase('b', null, 12),
    purchase('c', 'Outro', 3, '2026-10'),
  ]
  h.lines = [
    line('arroz', 'Mercearia', 1000),
    line('feijão', 'Mercearia', null),
    line('leite', 'Laticínios', 1300),
    line('vassoura', null, null),
  ]
})

describe('S-047 AC2: CycleScreen', () => {
  it('shows the month purchases with market and dd/mm date', () => {
    renderIt()
    expect(screen.getByRole('heading', { name: 'novembro de 2026' })).toBeInTheDocument()
    const rows = within(
      screen.getByRole('list', { name: strings.history.purchasesLabel }),
    ).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Atacadão')
    expect(rows[0]).toHaveTextContent('05/11')
    expect(rows[1]).toHaveTextContent(strings.history.noMarket)
    expect(rows[1]).toHaveTextContent('12/11')
    expect(screen.queryByText('Outro')).toBeNull()
  })

  it('groups lines by categoryName with price or a dash, and is read-only', () => {
    renderIt()
    const merc = screen.getByRole('region', { name: 'Mercearia' })
    expect(within(merc).getByText('arroz').closest('li')).toHaveTextContent(formatBRL(1000))
    expect(within(merc).getByText('feijão').closest('li')).toHaveTextContent(
      strings.history.noPrice,
    )
    expect(
      within(screen.getByRole('region', { name: strings.noCategory })).getByText('vassoura'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('S-047 AC3: category sums', () => {
  it('shows per-category sums, the line-based total and the unpriced count', () => {
    renderIt()
    const sums = screen.getByRole('region', { name: strings.history.categorySumTitle })
    expect(within(sums).getByText('Mercearia').closest('li')).toHaveTextContent(formatBRL(1000))
    expect(within(sums).getByText('Laticínios').closest('li')).toHaveTextContent(formatBRL(1300))
    expect(sums).toHaveTextContent(`${strings.history.total}${formatBRL(2300)}`)
    expect(sums).toHaveTextContent(strings.history.unpriced(2))
  })

  it('omits the unpriced note when every line has a price', () => {
    h.lines = [line('arroz', 'Mercearia', 1000)]
    renderIt()
    expect(screen.queryByText(/sem preço/)).toBeNull()
  })

  it('shows an empty state for a month without purchases', () => {
    h.purchases = []
    h.lines = []
    renderIt()
    expect(screen.getByText(strings.history.cycleEmpty)).toBeInTheDocument()
  })
})

describe('S-047 AC5: invalid cycle', () => {
  it('redirects to /historico', () => {
    renderIt('/historico/abc')
    expect(screen.getByText('months')).toBeInTheDocument()
  })
})
