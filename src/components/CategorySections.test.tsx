import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { groupByCategory } from '@/domain/categories'
import { CategorySections } from './CategorySections'

const categories = [
  { id: 'lat', name: 'Laticínios', order: 3 },
  { id: 'mer', name: 'Mercearia', order: 0 },
  { id: 'pet', name: 'Pets', order: 7 },
]
const items = [
  { id: '1', name: 'pilha', categoryId: null },
  { id: '2', name: 'leite', categoryId: 'lat' },
  { id: '3', name: 'arroz', categoryId: 'mer' },
  { id: '4', name: 'orfão', categoryId: 'apagada' },
]

describe('S-044 AC1: CategorySections', () => {
  it('renders one h2 per non-empty section in groupByCategory order, "Sem categoria" last', () => {
    render(
      <CategorySections
        items={items}
        categories={categories}
        renderItem={(i) => <li key={i.id}>{i.name}</li>}
      />,
    )
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(groupByCategory(items, categories).map((s) => s.name))
    expect(headings).toEqual(['Mercearia', 'Laticínios', 'Sem categoria'])
  })

  it('puts each item under its own section, in the given order', () => {
    render(
      <CategorySections
        items={items}
        categories={categories}
        renderItem={(i) => <li key={i.id}>{i.name}</li>}
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
      <CategorySections items={[]} categories={categories} renderItem={() => null} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
