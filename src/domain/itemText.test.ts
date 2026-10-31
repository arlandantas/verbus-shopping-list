import { describe, expect, it } from 'vitest'
import { formatQuantity, parseItemText } from './itemText'

describe('S-017 AC2: parseItemText', () => {
  it.each([
    ['feijão', 'feijão', 1, 'un'],
    ['3 kg feijão', 'feijão', 3, 'kg'],
    ['3kg feijão', 'feijão', 3, 'kg'],
    ['3 KG Feijão', 'Feijão', 3, 'kg'],
    ['2 kg de arroz', 'arroz', 2, 'kg'],
    ['1,5 kg carne', 'carne', 1.5, 'kg'],
    ['1.5 kg carne', 'carne', 1.5, 'kg'],
    ['500g queijo', 'queijo', 500, 'g'],
    ['2 leite', 'leite', 2, 'un'],
    ['2x sabão', 'sabão', 2, 'un'],
    ['2X sabão', 'sabão', 2, 'un'],
    ['2 x sabão', 'sabão', 2, 'un'],
    ['feijão 3kg', 'feijão', 3, 'kg'],
    ['feijão 3 kg', 'feijão', 3, 'kg'],
    ['coca 2', 'coca 2', 1, 'un'],
    ['1 dúzia ovos', 'ovos', 1, 'dz'],
    ['2 litros de leite', 'leite', 2, 'l'],
    ['3 Pacotes macarrão', 'macarrão', 3, 'pct'],
    ['2 unidades de pão', 'pão', 2, 'un'],
    ['2 quilos de batata', 'batata', 2, 'kg'],
    ['2 kg de  arroz   branco', 'arroz branco', 2, 'kg'],
    ['2leite', '2leite', 1, 'un'],
    ['pão de forma', 'pão de forma', 1, 'un'],
    ['2 metros de fio', 'metros de fio', 2, 'un'],
  ])('%j -> %j qty %d %s', (input, name, quantity, unit) => {
    expect(parseItemText(input)).toEqual({ name, quantity, unit })
  })
})

describe('S-017 AC3: edge cases', () => {
  it('trims and collapses whitespace in the name', () => {
    expect(parseItemText('   pão   de    forma  ')).toEqual({
      name: 'pão de forma',
      quantity: 1,
      unit: 'un',
    })
  })

  it.each(['', '   ', '3 kg', '3kg', '2x', '3', '3 kg de', '1,5 l'])('%j -> null', (input) => {
    expect(parseItemText(input)).toBeNull()
  })

  it.each([
    ['0 leite', '0 leite'],
    ['10000 kg arroz', '10000 kg arroz'],
    ['0 kg arroz', '0 kg arroz'],
    ['arroz 10000kg', 'arroz 10000kg'],
  ])('out-of-range quantity %j falls back to whole text', (input, name) => {
    expect(parseItemText(input)).toEqual({ name, quantity: 1, unit: 'un' })
  })

  it('accepts the 9999 boundary', () => {
    expect(parseItemText('9999 g sal')).toEqual({ name: 'sal', quantity: 9999, unit: 'g' })
  })

  it('truncates the name to 80 chars after parsing', () => {
    const r = parseItemText('2 kg ' + 'a'.repeat(100))
    expect(r?.quantity).toBe(2)
    expect(r?.name).toBe('a'.repeat(80))
  })
})

describe('S-017 AC5: formatQuantity', () => {
  it.each([
    [1.5, 'kg', '1,5 kg'],
    [2, 'l', '2 L'],
    [1, 'un', '1'],
    [3, 'un', '3'],
    [500, 'g', '500 g'],
    [0.5, 'kg', '0,5 kg'],
    [2, 'dz', '2 dz'],
    [250, 'ml', '250 ml'],
    [2, 'pct', '2 pct'],
  ] as const)('formatQuantity(%d, %j) -> %j', (q, unit, expected) => {
    expect(formatQuantity(q, unit)).toBe(expected)
  })
})
