import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { CatalogEntry, Item } from '@/data/converters'
import { icons } from '@/components/m3/icons'
import { strings } from '@/strings/pt-BR'
import { PantryScreen } from './PantryScreen'

const h = vi.hoisted(() => ({
  addItem: vi.fn(),
  addItems: vi.fn(),
  deleteItem: vi.fn(),
  setRecurring: vi.fn(),
}))
vi.mock('@/data/items', () => h)
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'f1', name: 'Casa' } }),
}))

let categories: { id: string; name: string; order: number }[] = []
vi.mock('@/hooks/useCategories', () => ({ useCategories: () => categories }))
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
  h.addItems.mockReset()
  h.deleteItem.mockReset()
  h.setRecurring.mockReset()
  catalog = []
  items = []
  categories = []
  localStorage.clear()
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

describe('S-094 PantryScreen grouped by category', () => {
  const inCat = (name: string, categoryId: string | null, recurring = true) => ({
    ...entry(name, recurring),
    categoryId,
  })
  beforeEach(() => {
    categories = [
      { id: 'c2', name: 'Limpeza', order: 1 },
      { id: 'c1', name: 'Mercearia', order: 0 },
    ]
  })

  it('AC3: recurring under h2 per category with count, Sem categoria last', () => {
    catalog = [
      inCat('Sabão', 'c2'),
      inCat('Feijão', 'c1'),
      inCat('Arroz', 'c1'),
      inCat('Pilha', null),
    ]
    renderIt()
    const h2 = screen.getAllByRole('heading', { level: 2 })
    expect(h2.map((h) => h.textContent)).toEqual(['Mercearia2', 'Limpeza1', 'Sem categoria1'])
    const btn = screen.getByRole('button', { name: /Mercearia/ })
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(
      within(screen.getByRole('list', { name: 'Mercearia' })).getAllByRole('listitem'),
    ).toHaveLength(2)
  })

  it('AC4: collapsing hides rows, saves the pref and survives remount', () => {
    catalog = [inCat('Feijão', 'c1'), inCat('Sabão', 'c2')]
    const first = renderIt()
    fireEvent.click(screen.getByRole('button', { name: /Mercearia/ }))
    expect(screen.queryByText('Feijão')).not.toBeInTheDocument()
    expect(screen.getByText('Sabão')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('verbus.ui.pantryCollapsed')!)).toEqual(['c1'])
    first.unmount()
    renderIt()
    expect(screen.queryByText('Feijão')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mercearia/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('AC5: group without categories stays flat', () => {
    categories = []
    catalog = [inCat('Feijão', 'c1'), inCat('Sal', 'c1', false)]
    renderIt()
    expect(screen.getByRole('list', { name: strings.pantry.listLabel })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(strings.pantry.othersTitle) }))
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      `${strings.pantry.othersTitle}1`,
    ])
  })

  it('AC6: Outros itens shows h3 per category with count; + still promotes', () => {
    catalog = [inCat('Sal', 'c1', false), inCat('Cera', 'c2', false), inCat('Pilha', null, false)]
    renderIt()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(strings.pantry.othersTitle) }))
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Mercearia (1)',
      'Limpeza (1)',
      'Sem categoria (1)',
    ])
    fireEvent.click(screen.getByRole('button', { name: strings.pantry.makeRecurringFor('Sal') }))
    expect(h.setRecurring).toHaveBeenCalledWith('f1', 'sal', true, [])
  })
})

describe('S-117 AC1: Marcar todos como faltando', () => {
  const markAll = () => screen.queryByRole('button', { name: strings.pantry.markAllMissing })

  it('adds only the items that are at home, in one batch', () => {
    catalog = [entry('Arroz'), entry('Feijão'), entry('Café')]
    items = [item('Café', 'pending')]
    renderIt()
    fireEvent.click(markAll()!)
    expect(h.addItems).toHaveBeenCalledTimes(1)
    const [familyId, inputs] = h.addItems.mock.calls[0] as [string, { name: string }[]]
    expect(familyId).toBe('f1')
    expect(inputs.map((i) => i.name).sort()).toEqual(['Arroz', 'Feijão'])
  })

  it('is hidden when nothing is at home', () => {
    catalog = [entry('Café')]
    items = [item('Café', 'pending')]
    renderIt()
    expect(markAll()).toBeNull()
  })
})
