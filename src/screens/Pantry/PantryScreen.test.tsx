import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { CatalogEntry, Item } from '@/data/converters'
import { strings } from '@/strings/pt-BR'
import { PantryScreen } from './PantryScreen'

const h = vi.hoisted(() => ({ addItem: vi.fn(), deleteItem: vi.fn() }))
vi.mock('@/data/items', () => h)
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'f1', name: 'Casa' } }),
}))

let catalog: CatalogEntry[] = []
let items: Item[] = []
vi.mock('@/screens/List/useCatalog', () => ({ useCatalog: () => catalog }))
vi.mock('@/screens/List/useItems', () => ({ useItems: () => items }))

const entry = (name: string, recurring = true): CatalogEntry => ({
  name,
  nameKey: name.toLowerCase(),
  quantity: 3,
  unit: 'kg',
  categoryId: 'c1',
  recurring,
  lastUsedAt: new Date(),
})
const item = (name: string, status: 'pending' | 'bought', id = 'i1'): Item =>
  ({
    id,
    name,
    nameKey: name.toLowerCase(),
    status,
    createdAt: new Date(),
  }) as Item

const renderIt = () =>
  render(
    <MemoryRouter>
      <PantryScreen />
    </MemoryRouter>,
  )

beforeEach(() => {
  h.addItem.mockReset()
  h.deleteItem.mockReset()
  catalog = []
  items = []
})

describe('S-024 PantryScreen', () => {
  it('AC6: empty state explains how to mark recurring', () => {
    catalog = [entry('Sal', false)]
    renderIt()
    expect(screen.getByText(strings.pantry.empty)).toBeInTheDocument()
  })

  it('AC2: atHome row adds the catalog quantity/unit/category as recurring', () => {
    catalog = [entry('Feijão')]
    renderIt()
    const btn = screen.getByRole('button', { name: /Feijão/ })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn).toHaveTextContent(strings.pantry.atHome)
    fireEvent.click(btn)
    expect(h.addItem).toHaveBeenCalledWith('f1', {
      name: 'Feijão',
      quantity: 3,
      unit: 'kg',
      categoryId: 'c1',
      recurring: true,
    })
  })

  it('AC3: missing row is pressed and deletes the pending item', () => {
    catalog = [entry('Feijão')]
    items = [item('Feijão', 'pending', 'p9')]
    renderIt()
    const btn = screen.getByRole('button', { name: /Feijão/ })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(btn).toHaveTextContent(strings.pantry.missing)
    fireEvent.click(btn)
    expect(h.deleteItem).toHaveBeenCalledWith('f1', 'p9')
  })

  it('AC4: inCart row is disabled', () => {
    catalog = [entry('Feijão')]
    items = [item('Feijão', 'bought')]
    renderIt()
    const btn = screen.getByRole('button', { name: /Feijão/ })
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent(strings.pantry.inCart)
  })
})
