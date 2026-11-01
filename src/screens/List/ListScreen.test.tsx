import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { CatalogEntry } from '@/data/converters'
import { strings } from '@/strings/pt-BR'
import { ListScreen } from './ListScreen'

const addItem = vi.hoisted(() => vi.fn())
const toggleItemStatus = vi.hoisted(() => vi.fn())
const itemsState = vi.hoisted(() => ({ items: [] as unknown[] }))
vi.mock('@/data/items', () => ({ addItem, toggleItemStatus }))
const cycleState = vi.hoisted(() => ({ added: 0, dismiss: vi.fn() }))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({
    family: { id: 'f1', name: 'Casa' },
    recurringAdded: cycleState.added,
    dismissRecurringNotice: cycleState.dismiss,
  }),
}))
vi.mock('@/app/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
vi.mock('@/hooks/useMemberNames', () => ({ useMemberNames: () => ({}) }))
vi.mock('./useItems', () => ({ useItems: () => itemsState.items }))
vi.mock('@/hooks/useCategories', () => ({ useCategories: () => [] }))

const catalog: CatalogEntry[] = [
  {
    name: 'Arroz',
    nameKey: 'arroz',
    quantity: 2,
    unit: 'kg',
    categoryId: null,
    recurring: true,
    lastUsedAt: new Date(),
  },
]
vi.mock('./useCatalog', () => ({ useCatalog: () => catalog }))
vi.mock('./AddItemBar', () => ({
  AddItemBar: (p: {
    onAdd: (t: string) => void
    onPick: (e: CatalogEntry, t: null) => void
    catalog: CatalogEntry[]
  }) => (
    <div>
      <button onClick={() => p.onAdd('arroz')}>free</button>
      <button onClick={() => p.onAdd('leite')}>free-new</button>
      <button onClick={() => p.onPick(p.catalog[0]!, null)}>pick</button>
    </div>
  ),
}))

beforeEach(() => addItem.mockReset())
const renderIt = () =>
  render(
    <MemoryRouter>
      <ListScreen />
    </MemoryRouter>,
  )

describe('S-023 AC6: ListScreen passes catalog recurring', () => {
  it('free text matching a recurring catalog entry passes recurring true', () => {
    renderIt()
    fireEvent.click(screen.getByText('free'))
    expect(addItem.mock.calls[0]![1]).toMatchObject({ recurring: true })
  })

  it('free text without catalog match leaves recurring undefined', () => {
    renderIt()
    fireEvent.click(screen.getByText('free-new'))
    expect(addItem.mock.calls[0]![1].recurring).toBeUndefined()
  })

  it('picking a suggestion passes the entry recurring', () => {
    renderIt()
    fireEvent.click(screen.getByText('pick'))
    expect(addItem.mock.calls[0]![1]).toMatchObject({ recurring: true })
  })
})

describe('S-053 AC3: ListScreen header', () => {
  it('has no text nav links, shows the family name and a market icon button', () => {
    renderIt()
    for (const n of [strings.pantry.link, strings.history.link, strings.family.title])
      expect(screen.queryByRole('link', { name: n })).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Casa' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.market.enter })).toBeInTheDocument()
  })
})

describe('S-028 AC1: ListScreen uses the shared toggleItemStatus', () => {
  it('checking a row calls toggleItemStatus(familyId, item)', () => {
    const it = {
      id: 'i1',
      name: 'arroz',
      quantity: 1,
      unit: 'un',
      note: null,
      status: 'pending',
    }
    itemsState.items = [it]
    renderIt()
    fireEvent.click(screen.getByRole('checkbox', { name: strings.list.markBought('arroz') }))
    expect(toggleItemStatus).toHaveBeenCalledWith('f1', it)
    itemsState.items = []
  })
})

describe('S-046 AC1: Finalizar compra on the list screen', () => {
  const mk = (status: string) => ({ id: 'i1', name: 'arroz', quantity: 1, unit: 'un', status })
  it('hidden without bought items', () => {
    itemsState.items = [mk('pending')]
    renderIt()
    expect(screen.queryByRole('link', { name: strings.checkout.link })).toBeNull()
    itemsState.items = []
  })

  it('shown, linking to /finalizar, with a bought item', () => {
    itemsState.items = [mk('bought')]
    renderIt()
    expect(screen.getByRole('link', { name: strings.checkout.link })).toHaveAttribute(
      'href',
      '/finalizar',
    )
    itemsState.items = []
  })
})

describe('S-049 AC1: ListScreen shows the returned-recurring notice', () => {
  afterEach(() => {
    cycleState.added = 0
  })

  it('shows the notice when recurring items returned and dismisses via OK', () => {
    cycleState.added = 2
    renderIt()
    expect(screen.getByRole('status')).toHaveTextContent('2 recorrentes voltaram para a lista')
    fireEvent.click(screen.getByRole('button', { name: strings.cycle.ok }))
    expect(cycleState.dismiss).toHaveBeenCalled()
  })

  it('shows nothing when none returned', () => {
    renderIt()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
