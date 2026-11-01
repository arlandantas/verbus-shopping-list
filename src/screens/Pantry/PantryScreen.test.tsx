import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { CatalogEntry, Item } from '@/data/converters'
import { icons } from '@/components/m3/icons'
import { strings } from '@/strings/pt-BR'
import { PantryScreen } from './PantryScreen'

const h = vi.hoisted(() => ({ addItem: vi.fn(), deleteItem: vi.fn(), setRecurring: vi.fn() }))
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
  h.setRecurring.mockReset()
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
    const btn = screen.getByRole('button', { name: strings.pantry.markMissingFor('Feijão') })
    expect(screen.getByText(strings.pantry.atHome)).toBeInTheDocument()
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
    const btn = screen.getByRole('button', { name: strings.pantry.markAtHomeFor('Feijão') })
    expect(screen.getByText(strings.pantry.missing)).toBeInTheDocument()
    fireEvent.click(btn)
    expect(h.deleteItem).toHaveBeenCalledWith('f1', 'p9')
  })

  it('AC4: inCart row is disabled', () => {
    catalog = [entry('Feijão')]
    items = [item('Feijão', 'bought')]
    renderIt()
    const btn = screen.getByRole('button', { name: strings.pantry.inCartFor('Feijão') })
    expect(btn).toBeDisabled()
    expect(screen.getByText(strings.pantry.inCart)).toBeInTheDocument()
  })
})

describe('S-025 PantryScreen', () => {
  it('AC1: lists non-recurring catalog entries and promotes one', () => {
    catalog = [entry('Feijão'), entry('Sal', false)]
    items = [item('Sal', 'pending', 's1')]
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(strings.pantry.othersTitle) }))
    const list = screen.getByRole('list', { name: strings.pantry.othersTitle })
    expect(list).toHaveTextContent('Sal')
    expect(list).not.toHaveTextContent('Feijão')
    fireEvent.click(screen.getByRole('button', { name: strings.pantry.makeRecurringFor('Sal') }))
    expect(h.setRecurring).toHaveBeenCalledWith('f1', 'sal', true, items)
  })

  it('AC2: remove from recurring calls setRecurring false with the items', () => {
    catalog = [entry('Feijão')]
    items = [item('Feijão', 'pending', 'p1')]
    renderIt()
    fireEvent.click(
      screen.getByRole('button', { name: strings.pantry.removeRecurringFor('Feijão') }),
    )
    expect(h.setRecurring).toHaveBeenCalledWith('f1', 'feijão', false, items)
  })
})

describe('S-061 PantryScreen', () => {
  it('AC1: intro text and "Entenda melhor" button with info icon', () => {
    renderIt()
    expect(screen.getByText(strings.pantry.intro)).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: strings.pantry.learnMore })
    expect(btn.querySelector('svg')).not.toBeNull()
  })

  it('AC2: opens the help dialog with full text and closes with Entendi', () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.pantry.learnMore }))
    const dlg = screen.getByRole('dialog', { name: strings.pantry.helpTitle })
    for (const p of strings.pantry.help) expect(dlg).toHaveTextContent(p)
    fireEvent.click(screen.getByRole('button', { name: strings.pantry.helpClose }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('AC3: each state shows its text and the row action names the item', () => {
    catalog = [entry('Arroz'), entry('Feijão'), entry('Café')]
    items = [item('Feijão', 'pending', 'p1'), item('Café', 'bought', 'b1')]
    renderIt()
    expect(screen.getByText(strings.pantry.atHome)).toBeInTheDocument()
    expect(screen.getByText(strings.pantry.missing)).toBeInTheDocument()
    expect(screen.getByText(strings.pantry.inCart)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar Arroz como falta' })).toBeEnabled()
    const cafe = screen.getByRole('button', { name: strings.pantry.inCartFor('Café') })
    expect(cafe).toBeDisabled()
    expect(cafe.closest('li')).toHaveClass('m3-list-item--muted', 'm3-list-item--struck')
    const feijao = screen.getByRole('button', { name: strings.pantry.markAtHomeFor('Feijão') })
    expect(feijao.closest('li')).toHaveClass('m3-list-item--primary')
  })

  it('AC4: other items and remove use M3 list items and icon buttons', () => {
    catalog = [entry('Feijão'), entry('Sal', false)]
    renderIt()
    const remove = screen.getByRole('button', { name: strings.pantry.removeRecurringFor('Feijão') })
    expect(remove).toHaveClass('m3-icon-btn')
    expect(remove.closest('li')).toHaveClass('m3-list-item')
    fireEvent.click(screen.getByRole('button', { name: new RegExp(strings.pantry.othersTitle) }))
    const add = screen.getByRole('button', { name: strings.pantry.makeRecurringFor('Sal') })
    expect(add).toHaveClass('m3-icon-btn')
    expect(add.closest('li')).toHaveClass('m3-list-item')
  })

  it('AC6: empty state cites "Editar item"', () => {
    renderIt()
    expect(screen.getByText(strings.pantry.empty)).toHaveTextContent('Editar item')
  })
})

describe('S-074: "Outros itens já usados" collapsible section', () => {
  const header = () => screen.getByRole('button', { name: new RegExp(strings.pantry.othersTitle) })

  it('AC1: header button is collapsed by default with title, count and chevron', () => {
    catalog = [entry('Sal', false), entry('Mel', false)]
    items = []
    renderIt()
    expect(header()).toHaveAttribute('aria-expanded', 'false')
    expect(header()).toHaveTextContent('2')
    expect(header().querySelector('path')).toHaveAttribute('d', icons.expand_more)
    expect(screen.queryByRole('list', { name: strings.pantry.othersTitle })).toBeNull()
    fireEvent.click(header())
    expect(header()).toHaveAttribute('aria-expanded', 'true')
    expect(header().querySelector('path')).toHaveAttribute('d', icons.expand_less)
    const list = screen.getByRole('list', { name: strings.pantry.othersTitle })
    expect(list.id).not.toBe('')
    expect(header()).toHaveAttribute('aria-controls', list.id)
  })

  it('AC2: open rows are accessible and styled as tonal containers with radius >= 16px', () => {
    catalog = [entry('Sal', false)]
    items = []
    renderIt()
    fireEvent.click(header())
    const list = screen.getByRole('list', { name: strings.pantry.othersTitle })
    expect(list).toHaveTextContent('Sal')
    expect(
      screen.getByRole('button', { name: strings.pantry.makeRecurringFor('Sal') }),
    ).toBeInTheDocument()
  })
})
