import type { CatalogEntry, Item } from '@/data/converters'
import { catalogConverter } from '@/data/converters'
import { groupForPantry, pantryState } from './pantry'

const entry = (name: string, nameKey: string, recurring?: boolean): CatalogEntry => ({
  name,
  nameKey,
  quantity: 1,
  unit: 'un',
  categoryId: null,
  recurring: recurring ?? false,
  lastUsedAt: new Date(2026, 9, 1),
})

const item = (id: string, nameKey: string, status: Item['status'], day: number): Item => ({
  id,
  name: nameKey,
  nameKey,
  quantity: 1,
  unit: 'un',
  note: null,
  categoryId: null,
  recurring: true,
  status,
  markedBy: null,
  markedAt: null,
  priceCents: null,
  createdBy: 'u',
  createdAt: new Date(2026, 9, day),
  hasPendingWrites: false,
})

describe('S-023 AC1: pantryState', () => {
  it('returns only recurring entries sorted by pt-BR name with state and latest pending id', () => {
    const catalog = [
      entry('Zebra', 'zebra', true),
      entry('Água', 'agua', true),
      entry('arroz', 'arroz', true),
      entry('feijão', 'feijao', true),
      entry('sal', 'sal', false),
    ]
    const items = [
      item('a1', 'arroz', 'pending', 1),
      item('a2', 'arroz', 'pending', 5),
      item('a3', 'arroz', 'bought', 9),
      item('f1', 'feijao', 'bought', 2),
      item('s1', 'sal', 'pending', 3),
    ]
    const r = pantryState(catalog, items)
    expect(r.map((p) => [p.entry.name, p.state, p.pendingId])).toEqual([
      ['Água', 'atHome', null],
      ['arroz', 'missing', 'a2'],
      ['feijão', 'inCart', null],
      ['Zebra', 'atHome', null],
    ])
  })
})

describe('S-023 AC5: CatalogEntry.recurring default', () => {
  it('is false when the field is missing in the doc', () => {
    const snap = {
      data: () => ({ name: 'Arroz', nameKey: 'arroz', quantity: 1, unit: 'un', lastUsedAt: null }),
    }
    const e = catalogConverter.fromFirestore(snap as never, {})
    expect(e.recurring).toBe(false)
    const t = {
      data: () => ({ name: 'A', nameKey: 'a', quantity: 1, unit: 'un', recurring: true }),
    }
    expect(catalogConverter.fromFirestore(t as never, {}).recurring).toBe(true)
  })
})

describe('S-094 groupForPantry', () => {
  const cats = [
    { id: 'b', name: 'Bebidas', order: 1 },
    { id: 'a', name: 'Açougue', order: 0 },
    { id: 'z', name: 'Vazia', order: 2 },
  ]
  const e = (name: string, categoryId: string | null) => ({ name, categoryId })
  const same = (x: { categoryId: string | null }) => x.categoryId

  it('AC1: sorts by order, "Sem categoria" last with orphan ids, omits empty, keeps input order', () => {
    const items = [
      e('arroz', null),
      e('cola', 'b'),
      e('bife', 'a'),
      e('ovo', 'ghost'),
      e('água', 'b'),
    ]
    const groups = groupForPantry(items, cats, same)!
    expect(groups.map((g) => g.name)).toEqual(['Açougue', 'Bebidas', 'Sem categoria'])
    expect(groups[1]!.items.map((i) => i.name)).toEqual(['cola', 'água'])
    expect(groups[2]!.items.map((i) => i.name)).toEqual(['arroz', 'ovo'])
  })

  it('AC2: null with zero categories or when no entry has a known category', () => {
    expect(groupForPantry([e('arroz', 'a')], [], same)).toBeNull()
    expect(groupForPantry([e('arroz', null), e('ovo', 'ghost')], cats, same)).toBeNull()
  })
})
