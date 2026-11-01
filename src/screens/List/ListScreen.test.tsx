import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { CatalogEntry } from '@/data/converters'
import { strings } from '@/strings/pt-BR'
import { ListScreen } from './ListScreen'

const addItem = vi.hoisted(() => vi.fn())
const toggleItemStatus = vi.hoisted(() => vi.fn())
const setItemStatus = vi.hoisted(() => vi.fn())
const itemsState = vi.hoisted(() => ({ items: [] as unknown[] }))
vi.mock('@/data/items', () => ({ addItem, toggleItemStatus, setItemStatus }))
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

beforeEach(() => {
  addItem.mockReset()
  setItemStatus.mockReset()
  toggleItemStatus.mockReset()
})
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

const mk = (over: Record<string, unknown> = {}) => ({
  id: 'i1',
  name: 'arroz',
  quantity: 2,
  unit: 'kg',
  note: null,
  status: 'pending',
  markedBy: null,
  priceCents: null,
  categoryId: null,
  ...over,
})
afterEach(() => {
  itemsState.items = []
})

describe('S-058 AC1/AC2: row layout and tap targets', () => {
  it('checkbox named by the item, supporting line, edit button; row tap toggles, edit does not', () => {
    const it = mk({ note: 'integral' })
    itemsState.items = [it]
    renderIt()
    const row = screen.getByRole('listitem')
    expect(within(row).getByRole('checkbox', { name: 'arroz' })).not.toBeChecked()
    expect(row).toHaveTextContent('2 kg · integral')
    fireEvent.click(within(row).getByRole('button', { name: strings.list.edit('arroz') }))
    expect(toggleItemStatus).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('arroz'))
    expect(toggleItemStatus).toHaveBeenCalledWith('f1', it)
  })

  it('checkbox click toggles exactly once', () => {
    itemsState.items = [mk()]
    renderIt()
    fireEvent.click(screen.getByRole('checkbox', { name: 'arroz' }))
    expect(toggleItemStatus).toHaveBeenCalledTimes(1)
  })
})

describe('S-058 AC3: bought rows', () => {
  it('struck, checked, shows "por você" and price; pending also shows price', () => {
    itemsState.items = [
      mk({ status: 'bought', markedBy: 'u1', priceCents: 1290 }),
      mk({ id: 'i2', name: 'leite', priceCents: 500 }),
    ]
    renderIt()
    expect(screen.getByRole('checkbox', { name: 'arroz' })).toBeChecked()
    expect(screen.getByText('arroz').closest('li')).toHaveClass('m3-list-item--struck')
    expect(screen.getByText('arroz').closest('li')).toHaveTextContent(/por você.*R\$\s12,90/)
    expect(screen.getByText('leite').closest('li')).toHaveTextContent(/R\$\s5,00/)
    expect(screen.getByText('leite').closest('li')).not.toHaveClass('m3-list-item--struck')
  })
})

describe('S-058 AC4: top bar counter and Finalizar compra', () => {
  it('no checkout action and no counter on an empty list', () => {
    renderIt()
    expect(screen.getByRole('heading', { level: 1, name: 'Casa' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: strings.checkout.link })).toBeNull()
  })

  it('counter without bought: no Finalizar', () => {
    itemsState.items = [mk(), mk({ id: 'i2', name: 'leite' })]
    renderIt()
    expect(screen.getByText(strings.market.counter(0, 2))).toHaveAttribute('aria-live', 'polite')
    expect(screen.queryByRole('link', { name: strings.checkout.link })).toBeNull()
  })

  it('with a bought item: Finalizar links to /finalizar', () => {
    itemsState.items = [mk({ status: 'bought' }), mk({ id: 'i2', name: 'leite' })]
    renderIt()
    expect(screen.getByText(strings.market.counter(1, 2))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: strings.checkout.link })).toHaveAttribute(
      'href',
      '/finalizar',
    )
    expect(screen.queryByText(strings.market.allDone)).toBeNull()
  })

  it('all bought shows the complete message', () => {
    itemsState.items = [mk({ status: 'bought' })]
    renderIt()
    expect(screen.getByText(strings.market.allDone)).toBeInTheDocument()
  })
})

describe('S-058 AC7: snackbar Desfazer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  const snack = () => screen.queryByText(strings.list.addedToCart)

  it('marking shows the snackbar; Desfazer sets that item pending', () => {
    itemsState.items = [mk()]
    renderIt()
    expect(snack()).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: 'arroz' }))
    expect(snack()).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.list.undo }))
    expect(setItemStatus).toHaveBeenCalledWith('f1', 'i1', 'pending')
    expect(snack()).toBeNull()
  })

  it('disappears after about 4 s', () => {
    itemsState.items = [mk()]
    renderIt()
    fireEvent.click(screen.getByText('arroz'))
    act(() => void vi.advanceTimersByTime(3900))
    expect(snack()).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(200))
    expect(snack()).toBeNull()
  })

  it('marking another item replaces it: Desfazer targets the new item', () => {
    itemsState.items = [mk(), mk({ id: 'i2', name: 'leite' })]
    renderIt()
    fireEvent.click(screen.getByText('arroz'))
    fireEvent.click(screen.getByText('leite'))
    expect(screen.getAllByText(strings.list.addedToCart)).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: strings.list.undo }))
    expect(setItemStatus).toHaveBeenCalledWith('f1', 'i2', 'pending')
  })

  it('unmarking shows no snackbar', () => {
    itemsState.items = [mk({ status: 'bought' })]
    renderIt()
    fireEvent.click(screen.getByRole('checkbox', { name: 'arroz' }))
    expect(snack()).toBeNull()
    expect(toggleItemStatus).toHaveBeenCalled()
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

describe('S-059 AC3/AC4: hide switch and persisted prefs', () => {
  const mk = (id: string, status: string, categoryId: string | null = null) => ({
    id,
    name: id,
    nameKey: id,
    quantity: 1,
    unit: 'un',
    categoryId,
    status,
    recurring: false,
    note: null,
    priceCents: null,
    markedBy: null,
  })
  beforeEach(() => window.localStorage.clear())

  it('has no switch on an empty list', () => {
    itemsState.items = []
    renderIt()
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('hides bought items, persists and restores the switch and collapsed categories', () => {
    itemsState.items = [mk('a', 'bought'), mk('b', 'pending')]
    const first = renderIt()
    fireEvent.click(screen.getByRole('switch', { name: strings.market.hideInCart }))
    expect(screen.getByText(strings.market.hiddenCount(1))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Sem categoria/ }))
    expect(window.localStorage.getItem('verbus.ui.hideBought')).toBe('true')
    expect(window.localStorage.getItem('verbus.ui.collapsed')).toBe('["none"]')
    first.unmount()
    renderIt()
    expect(screen.getByRole('switch', { name: strings.market.hideInCart })).toBeChecked()
    expect(screen.getByRole('button', { name: /Sem categoria/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('falls back to defaults on corrupt storage', () => {
    itemsState.items = [mk('b', 'pending')]
    window.localStorage.setItem('verbus.ui.hideBought', 'zzz')
    window.localStorage.setItem('verbus.ui.collapsed', '{"x":1}')
    renderIt()
    expect(screen.getByRole('switch', { name: strings.market.hideInCart })).not.toBeChecked()
    expect(screen.getByRole('button', { name: /Sem categoria/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})
