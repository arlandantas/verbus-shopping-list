import type { CatalogEntry } from '@/data/converters'
import { buildPasteRows, splitPastedList } from './pasteList'

describe('S-093 AC1: splitPastedList', () => {
  it('returns null for a single plain line', () => {
    expect(splitPastedList('arroz')).toBeNull()
    expect(splitPastedList('1,5 kg arroz')).toBeNull()
    expect(splitPastedList('arroz\n')).toBeNull()
  })
  it('splits on LF and CRLF', () => {
    expect(splitPastedList('a\nb')).toEqual(['a', 'b'])
    expect(splitPastedList('a\r\nb\r\n')).toEqual(['a', 'b'])
  })
  it('splits one line by ; and by commas outside digits', () => {
    expect(splitPastedList('arroz, feijão, leite')).toEqual(['arroz', 'feijão', 'leite'])
    expect(splitPastedList('arroz; 1,5 kg feijão')).toEqual(['arroz', '1,5 kg feijão'])
  })
  it('does not split on commas across several lines', () => {
    expect(splitPastedList('arroz, integral\nleite')).toEqual(['arroz, integral', 'leite'])
  })
})

describe('S-093 AC2: markers', () => {
  it.each(['- a', '* a', '+ a', '• a', '· a', '– a', '— a', '[ ] a', '[x] a', '☐ a', '☑ a'])(
    'strips %s',
    (line) => expect(splitPastedList(`${line}\nb`)).toEqual(['a', 'b']),
  )
  it.each(['✅ a', '✔ a', '✔️ a', '1. a', '12) a', '- [ ] a'])('strips %s', (line) =>
    expect(splitPastedList(`${line}\nb`)).toEqual(['a', 'b']),
  )
  it('keeps quantities, drops empty and marker-only lines, trims', () => {
    expect(splitPastedList('  1.5 kg arroz  \n\n-\n  \n2 leite')).toEqual([
      '1.5 kg arroz',
      '2 leite',
    ])
  })
})

const entry = (over: Partial<CatalogEntry>): CatalogEntry => ({
  name: 'Feijão',
  nameKey: 'feijao',
  quantity: 2,
  unit: 'kg',
  categoryId: 'c1',
  recurring: true,
  lastUsedAt: new Date(2026, 9, 1),
  ...over,
})
const none: ReadonlySet<string> = new Set()

describe('S-093 AC3: buildPasteRows', () => {
  it('parses each line and keeps the first of repeated nameKeys', () => {
    const { rows, truncated } = buildPasteRows(['arroz', '2 kg feijão', 'Arroz'], [], none)
    expect(rows.map((r) => [r.name, r.quantity, r.unit])).toEqual([
      ['arroz', 1, 'un'],
      ['feijão', 2, 'kg'],
    ])
    expect(truncated).toBe(false)
  })
  it('cuts at 100 and flags truncated', () => {
    const lines = Array.from({ length: 101 }, (_, i) => `item ${i}`)
    const res = buildPasteRows(lines, [], none)
    expect(res.rows).toHaveLength(100)
    expect(res.truncated).toBe(true)
    expect(buildPasteRows(lines.slice(0, 100), [], none).truncated).toBe(false)
  })
  it('cuts names over 80 characters', () => {
    expect(buildPasteRows(['x'.repeat(120)], [], none).rows[0]!.name).toHaveLength(80)
  })
})

describe('S-093 AC4: catalog', () => {
  it('inherits name, category, recurring and quantity from the catalog', () => {
    const [r] = buildPasteRows(['feijao'], [entry({})], none).rows
    expect(r).toMatchObject({
      name: 'Feijão',
      categoryId: 'c1',
      recurring: true,
      quantity: 2,
      unit: 'kg',
    })
  })
  it('typed quantity and unit win', () => {
    const [r] = buildPasteRows(['3 un feijao'], [entry({})], none).rows
    expect(r).toMatchObject({ name: 'Feijão', quantity: 3, unit: 'un', categoryId: 'c1' })
  })
  it('without catalog: no category and no recurring', () => {
    const [r] = buildPasteRows(['feijao'], [], none).rows
    expect(r!.categoryId).toBeNull()
    expect(r).not.toHaveProperty('recurring')
  })
})

describe('S-093 AC5: pending duplicates', () => {
  it('unselects rows already pending and flags duplicate', () => {
    const { rows } = buildPasteRows(['arroz', 'leite'], [], new Set(['arroz']))
    expect(rows.map((r) => [r.selected, r.duplicate])).toEqual([
      [false, true],
      [true, false],
    ])
  })
})
