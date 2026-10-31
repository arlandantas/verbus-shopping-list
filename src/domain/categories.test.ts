import { describe, expect, it } from 'vitest'
import { strings } from '../strings/pt-BR'
import { DEFAULT_CATEGORIES, groupByCategory, nextCategoryOrder, sumByCategory } from './categories'

const cat = (id: string, name: string, order: number) => ({ id, name, order })

describe('S-036 AC1: default categories', () => {
  it('has the 6 ADR-0014 entries', () => {
    expect(DEFAULT_CATEGORIES.map((c) => [c.id, c.name, c.order])).toEqual([
      ['mercearia', 'Mercearia', 0],
      ['hortifruti', 'Hortifrúti', 1],
      ['carnes', 'Carnes', 2],
      ['laticinios', 'Laticínios', 3],
      ['limpeza', 'Limpeza', 4],
      ['higiene', 'Higiene pessoal', 5],
    ])
  })
})

describe('S-036 AC2: groupByCategory', () => {
  const categories = [
    cat('b', 'Beta', 1),
    cat('a', 'Alfa', 1),
    cat('z', 'Zeta', 0),
    cat('e', 'Vazia', 2),
  ]
  const items = [
    { id: '1', categoryId: 'a' },
    { id: '2', categoryId: null },
    { id: '3', categoryId: 'z' },
    { id: '4', categoryId: 'ghost' },
    { id: '5', categoryId: 'a' },
    { id: '6', categoryId: 'b' },
  ]

  it('orders by order then name, uncategorized last, omits empty', () => {
    const groups = groupByCategory(items, categories)
    expect(groups.map((g) => g.name)).toEqual(['Zeta', 'Alfa', 'Beta', strings.noCategory])
    expect(groups.map((g) => g.id)).toEqual(['z', 'a', 'b', null])
  })

  it('keeps input order inside a section and groups null and unknown together', () => {
    const groups = groupByCategory(items, categories)
    expect(groups[1].items.map((i) => i.id)).toEqual(['1', '5'])
    expect(groups[3].items.map((i) => i.id)).toEqual(['2', '4'])
  })

  it('returns no sections for no items', () => {
    expect(groupByCategory([], categories)).toEqual([])
  })
})

describe('S-036 AC3: nextCategoryOrder', () => {
  it('is max + 1, 0 when empty, capped at 999', () => {
    expect(nextCategoryOrder([])).toBe(0)
    expect(nextCategoryOrder([cat('a', 'A', 3), cat('b', 'B', 7)])).toBe(8)
    expect(nextCategoryOrder([cat('a', 'A', 999)])).toBe(999)
  })
})

describe('S-036 AC4: sumByCategory', () => {
  it('sums priced lines, counts unpriced, sorts by value desc', () => {
    const r = sumByCategory([
      { categoryName: 'Carnes', priceCents: 1000 },
      { categoryName: null, priceCents: 5000 },
      { categoryName: 'Carnes', priceCents: 500 },
      { categoryName: 'Limpeza', priceCents: null },
      { categoryName: 'Limpeza', priceCents: 200 },
    ])
    expect(r.rows).toEqual([
      { name: strings.noCategory, totalCents: 5000 },
      { name: 'Carnes', totalCents: 1500 },
      { name: 'Limpeza', totalCents: 200 },
    ])
    expect(r.totalCents).toBe(6700)
    expect(r.unpricedCount).toBe(1)
  })

  it('handles empty input', () => {
    expect(sumByCategory([])).toEqual({ rows: [], totalCents: 0, unpricedCount: 0 })
  })
})
