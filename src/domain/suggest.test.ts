import type { CatalogEntry } from '@/data/converters'
import { parseItemText } from './itemText'
import { suggest } from './suggest'

const entry = (name: string, nameKey: string, day: number): CatalogEntry => ({
  name,
  nameKey,
  quantity: 1,
  unit: 'un',
  categoryId: null,
  recurring: false,
  lastUsedAt: new Date(2026, 9, day),
})

const entries = [
  entry('caldo de feijão', 'caldo de feijao', 20),
  entry('feijão', 'feijao', 1),
  entry('Feijão preto', 'feijao preto', 10),
  entry('arroz', 'arroz', 5),
]

describe('S-020 AC1: suggest', () => {
  it('matches name start before word start, then lastUsedAt desc; accent/case-insensitive', () => {
    const r = suggest(entries, 'FEI', new Set())
    expect(r.map((e) => e.name)).toEqual(['Feijão preto', 'feijão', 'caldo de feijão'])
  })

  it('matches multi-word queries mid-name ("de fei" -> caldo de feijão)', () => {
    const r = suggest(entries, 'de fei', new Set())
    expect(r.map((e) => e.name)).toEqual(['caldo de feijão'])
  })

  it('returns [] for queries shorter than 2 characters', () => {
    expect(suggest(entries, 'f', new Set())).toEqual([])
    expect(suggest(entries, ' a ', new Set())).toEqual([])
  })

  it('excludes pending nameKeys', () => {
    const r = suggest(entries, 'fei', new Set(['feijao']))
    expect(r.map((e) => e.nameKey)).toEqual(['feijao preto', 'caldo de feijao'])
  })

  it('respects the limit (default 5)', () => {
    const many = Array.from({ length: 8 }, (_, i) => entry(`pão ${i}`, `pao ${i}`, i + 1))
    expect(suggest(many, 'pao', new Set())).toHaveLength(5)
    expect(suggest(many, 'pao', new Set(), 2)).toHaveLength(2)
  })
})

describe('S-020 AC2: query from parseItemText', () => {
  it('"3 kg fei" suggests feijão', () => {
    const q = parseItemText('3 kg fei')!.name
    expect(suggest(entries, q, new Set()).map((e) => e.name)).toContain('feijão')
  })
})
