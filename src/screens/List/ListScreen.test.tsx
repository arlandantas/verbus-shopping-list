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
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'f1', name: 'Casa' } }),
}))
vi.mock('@/app/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
vi.mock('@/hooks/useMemberNames', () => ({ useMemberNames: () => ({}) }))
vi.mock('./useItems', () => ({ useItems: () => itemsState.items }))

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

describe('S-024 AC1: ListScreen links to Despensa', () => {
  it('header has a Despensa link to /despensa', () => {
    renderIt()
    expect(screen.getByRole('link', { name: strings.pantry.link })).toHaveAttribute(
      'href',
      '/despensa',
    )
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
