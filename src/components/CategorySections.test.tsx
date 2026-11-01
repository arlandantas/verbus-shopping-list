import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { groupByCategory } from '@/domain/categories'
import { icons } from '@/components/m3/icons'
import { strings } from '@/strings/pt-BR'
import { CategorySections } from './CategorySections'

const categories = [
  { id: 'lat', name: 'Laticínios', order: 3 },
  { id: 'mer', name: 'Mercearia', order: 0 },
  { id: 'pet', name: 'Pets', order: 7 },
]
const noop = { collapsed: [] as string[], onToggleCollapsed: () => undefined, hideBought: false }
const items = [
  { id: '1', name: 'pilha', categoryId: null, status: 'pending' },
  { id: '2', name: 'leite', categoryId: 'lat', status: 'pending' },
  { id: '3', name: 'arroz', categoryId: 'mer', status: 'pending' },
  { id: '4', name: 'orfão', categoryId: 'apagada', status: 'pending' },
]

describe('S-044 AC1: CategorySections', () => {
  it('renders one h2 per non-empty section in groupByCategory order, "Sem categoria" last', () => {
    render(
      <CategorySections
        items={items}
        categories={categories}
        renderItem={(i) => <li key={i.id}>{i.name}</li>}
        {...noop}
      />,
    )
    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.querySelector('span')!.textContent)
    expect(headings).toEqual(groupByCategory(items, categories).map((s) => s.name))
    expect(headings).toEqual(['Mercearia', 'Laticínios', 'Sem categoria'])
  })

  it('puts each item under its own section, in the given order', () => {
    render(
      <CategorySections
        items={items}
        categories={categories}
        renderItem={(i) => <li key={i.id}>{i.name}</li>}
        {...noop}
      />,
    )
    const none = screen.getByRole('region', { name: 'Sem categoria' })
    expect(Array.from(none.querySelectorAll('li')).map((l) => l.textContent)).toEqual([
      'pilha',
      'orfão',
    ])
  })

  it('renders nothing for an empty list', () => {
    const { container } = render(
      <CategorySections items={[]} categories={categories} renderItem={() => null} {...noop} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})

const withStatus = [
  { id: 'a', name: 'arroz', categoryId: 'mer', status: 'bought' },
  { id: 'b', name: 'feijão', categoryId: 'mer', status: 'pending' },
  { id: 'c', name: 'leite', categoryId: 'lat', status: 'bought' },
]
const paths = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('path')).map((p) => p.getAttribute('d'))
const renderSecs = (props: Partial<typeof noop> = {}) =>
  render(
    <CategorySections
      items={withStatus}
      categories={categories}
      renderItem={(i) => <li key={i.id}>{i.name}</li>}
      {...noop}
      {...props}
    />,
  )

describe('S-059 AC1: collapsible header', () => {
  it('shows count, expand icon and aria-expanded; collapsed hides rows', () => {
    const onToggle = vi.fn()
    renderSecs({ collapsed: ['lat'], onToggleCollapsed: onToggle })
    const mer = screen.getByRole('button', { name: /Mercearia/ })
    expect(mer).toHaveTextContent('1/2')
    expect(mer).toHaveAttribute('aria-expanded', 'true')
    const listId = mer.getAttribute('aria-controls')
    expect(listId).toBeTruthy()
    expect(document.getElementById(listId!)).toContainElement(screen.getByText('arroz'))
    expect(paths(mer)).toContain(icons.expand_less)
    const lat = screen.getByRole('button', { name: /Laticínios/ })
    expect(lat).toHaveAttribute('aria-expanded', 'false')
    expect(paths(lat)).toContain(icons.expand_more)
    expect(screen.queryByText('leite')).toBeNull()
    expect(screen.getByText('arroz')).toBeInTheDocument()
    fireEvent.click(mer)
    expect(onToggle).toHaveBeenCalledWith('mer')
  })
})

describe('S-059 AC2: all in cart shows check', () => {
  it('only the fully bought category has the check icon', () => {
    renderSecs()
    expect(paths(screen.getByRole('button', { name: /Laticínios/ }))).toContain(icons.check)
    expect(paths(screen.getByRole('button', { name: /Mercearia/ }))).not.toContain(icons.check)
  })
})

describe('S-059 AC3: hide bought', () => {
  it('hides bought rows and shows the count line; all-bought keeps header + line', () => {
    renderSecs({ hideBought: true })
    expect(screen.queryByText('arroz')).toBeNull()
    expect(screen.getByText('feijão')).toBeInTheDocument()
    expect(screen.getAllByText(strings.market.hiddenCount(1))).toHaveLength(2)
    expect(screen.queryByText('leite')).toBeNull()
    expect(screen.getByRole('button', { name: /Laticínios/ })).toBeInTheDocument()
  })
})
