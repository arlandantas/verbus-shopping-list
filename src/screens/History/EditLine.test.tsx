import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { strings } from '@/strings/pt-BR'
import { CycleScreen } from './CycleScreen'

const h = vi.hoisted(() => ({ update: vi.fn(), lines: [] as unknown[] }))
vi.mock('@/data/items', () => ({ addItem: vi.fn() }))
vi.mock('@/data/history', () => ({ updatePurchaseLine: h.update }))
vi.mock('@/screens/List/useItems', () => ({ useItems: () => [] }))
vi.mock('@/screens/List/useCatalog', () => ({ useCatalog: () => [] }))
vi.mock('@/hooks/useCategories', () => ({ useCategories: () => [] }))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'f1', name: 'Casa' } }),
}))
vi.mock('@/hooks/useHistory', () => ({
  usePurchases: () => [
    {
      id: 'a',
      cycle: '2026-11',
      market: 'Mercado A',
      itemCount: 1,
      totalCents: null,
      purchasedAt: new Date(2026, 10, 14, 10),
      hasPendingWrites: false,
    },
  ],
  useCycleLines: () => h.lines,
}))

const arroz = {
  id: 'arroz',
  name: 'arroz',
  nameKey: 'arroz',
  categoryId: null,
  categoryName: 'Mercearia',
  priceCents: null,
  quantity: 1,
  unit: 'un',
  purchaseId: 'a',
}

const renderIt = () =>
  render(
    <MemoryRouter initialEntries={['/historico/2026-11']}>
      <Routes>
        <Route path="/historico/:cycle" element={<CycleScreen />} />
      </Routes>
    </MemoryRouter>,
  )
const edit = () => screen.queryByRole('button', { name: strings.history.editFor('arroz') })
const sheet = () => screen.getByRole('dialog', { name: strings.history.editTitle })
const save = () => within(sheet()).getByRole('button', { name: strings.item.save })

beforeEach(() => {
  localStorage.clear()
  h.update.mockReset()
  h.lines = [arroz]
})

describe('S-068 AC1: edit button only by purchase', () => {
  it('is absent by category and present by purchase', () => {
    renderIt()
    expect(edit()).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: strings.history.byPurchase }))
    expect(edit()).toBeInTheDocument()
  })
})

describe('S-068 AC2/AC3: edit sheet', () => {
  const open = () => {
    localStorage.setItem('verbus.ui.historyGroup', 'purchase')
    renderIt()
    fireEvent.click(edit()!)
  }

  it('shows read-only name, purchase info and fields; cancel closes without saving', () => {
    open()
    const s = within(sheet())
    expect(s.getByLabelText(strings.item.name)).toHaveAttribute('readonly')
    expect(s.getByLabelText(strings.history.purchaseInfo)).toHaveValue('sáb, 14 de nov · Mercado A')
    expect(s.getByLabelText(strings.item.quantity)).toHaveValue('1')
    expect(s.getByLabelText(strings.item.unit)).toHaveValue('un')
    expect(s.getByLabelText(strings.item.price)).toHaveValue('')
    fireEvent.click(s.getByRole('button', { name: strings.item.cancel }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(h.update).not.toHaveBeenCalled()
  })

  it('disables save with a message on invalid quantity or price', () => {
    open()
    const s = within(sheet())
    fireEvent.change(s.getByLabelText(strings.item.quantity), { target: { value: '0' } })
    expect(save()).toBeDisabled()
    expect(s.getByText(strings.item.quantityInvalid)).toBeInTheDocument()
    fireEvent.change(s.getByLabelText(strings.item.quantity), { target: { value: '2' } })
    fireEvent.change(s.getByLabelText(strings.item.price), { target: { value: 'abc' } })
    expect(save()).toBeDisabled()
    expect(s.getByText(strings.item.priceInvalid)).toBeInTheDocument()
  })

  it('saves only the changed fields and closes', () => {
    open()
    const s = within(sheet())
    fireEvent.change(s.getByLabelText(strings.item.quantity), { target: { value: '2' } })
    fireEvent.change(s.getByLabelText(strings.item.price), { target: { value: '12,90' } })
    fireEvent.click(save())
    expect(h.update).toHaveBeenCalledWith('f1', arroz, { quantity: 2, priceCents: 1290 }, [arroz])
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
