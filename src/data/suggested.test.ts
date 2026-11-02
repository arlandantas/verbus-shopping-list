import { addSuggestedItems } from './suggested'

const h = vi.hoisted(() => ({ cats: vi.fn(), items: vi.fn() }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocsFromServer: vi.fn(),
  limit: vi.fn(),
  query: vi.fn(),
}))
vi.mock('@/data/firebase', () => ({ db: {} }))
vi.mock('./categories', () => ({ addCategories: h.cats }))
vi.mock('./items', () => ({ addItems: h.items }))

const model = {
  id: 'm',
  name: 'M',
  categories: [
    { name: 'Alimentos', items: ['Arroz', 'Feijão'] },
    { name: 'Limpeza', items: ['Sabão'] },
    { name: 'Carnes', items: ['Carne'] },
  ],
}

describe('S-111: addSuggestedItems', () => {
  beforeEach(() => {
    h.cats.mockReset().mockReturnValue(['c-ali', 'c-lim'])
    h.items.mockReset().mockReturnValue([])
  })

  it('creates only the categories that have chosen items, then adds items with their ids', () => {
    addSuggestedItems('g1', model, new Set(['Arroz', 'Sabão']), [])
    expect(h.cats).toHaveBeenCalledWith('g1', ['Alimentos', 'Limpeza'], [])
    expect(h.items).toHaveBeenCalledWith('g1', [
      { name: 'Arroz', quantity: 1, unit: 'un', categoryId: 'c-ali' },
      { name: 'Sabão', quantity: 1, unit: 'un', categoryId: 'c-lim' },
    ])
  })

  it('reuses an existing category with the same name', () => {
    h.cats.mockReturnValue(['c-lim'])
    const existing = [{ id: 'old', name: 'alimentos', order: 0 }]
    addSuggestedItems('g1', model, new Set(['Arroz', 'Sabão']), existing)
    expect(h.cats).toHaveBeenCalledWith('g1', ['Limpeza'], existing)
    expect(h.items.mock.calls[0]![1].map((i: { categoryId: string }) => i.categoryId)).toEqual([
      'old',
      'c-lim',
    ])
  })
})
