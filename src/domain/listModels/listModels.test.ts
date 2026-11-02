import { toNameKey } from '../nameKey'
import { CURRENT_MODEL, LIST_MODELS } from '.'

describe('S-111 AC1: list models', () => {
  it('has the família brasileira model with the seven source categories', () => {
    expect(CURRENT_MODEL.id).toBe('familia-brasileira')
    expect(CURRENT_MODEL.categories.map((c) => c.name)).toEqual([
      'Alimentos',
      'Hortifrúti',
      'Padaria e geladeira',
      'Carnes',
      'Limpeza',
      'Higiene pessoal',
      'Utilidades',
    ])
    expect(CURRENT_MODEL.categories.flatMap((c) => c.items)).toHaveLength(96)
  })

  it.each(LIST_MODELS.map((m) => [m.id, m] as const))(
    '%s: no duplicate item or category, names fit the limits',
    (_, model) => {
      const items = model.categories.flatMap((c) => c.items.map(toNameKey))
      expect(new Set(items).size).toBe(items.length)
      const cats = model.categories.map((c) => toNameKey(c.name))
      expect(new Set(cats).size).toBe(cats.length)
      for (const c of model.categories) {
        expect(c.name.length).toBeLessThanOrEqual(40)
        expect(c.items.length).toBeGreaterThan(0)
        for (const i of c.items) expect(i.length).toBeLessThanOrEqual(80)
      }
    },
  )
})
