import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { UNITS, parseUnit } from './units'

describe('S-017 AC1: units', () => {
  it('UNITS is exactly the ADR-0008 list', () => {
    expect([...UNITS]).toEqual(['un', 'kg', 'g', 'l', 'ml', 'pct', 'cx', 'dz'])
  })

  it('UNITS equals the list hardcoded in firestore.rules (no drift)', () => {
    const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8')
    const m = /function validUnit\(v\)\s*\{\s*return v in \[([^\]]*)\];/.exec(rules)
    expect(m).not.toBeNull()
    const inRules = [...m![1]!.matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(inRules).toEqual([...UNITS])
  })

  it.each([
    ['kg', 'kg'],
    ['KG', 'kg'],
    ['quilo', 'kg'],
    ['Quilos', 'kg'],
    ['kilo', 'kg'],
    ['grama', 'g'],
    ['gramas', 'g'],
    ['g', 'g'],
    ['litro', 'l'],
    ['Litros', 'l'],
    ['L', 'l'],
    ['ml', 'ml'],
    ['ML', 'ml'],
    ['unidade', 'un'],
    ['unidades', 'un'],
    ['un', 'un'],
    ['pacote', 'pct'],
    ['PACOTES', 'pct'],
    ['pct', 'pct'],
    ['caixa', 'cx'],
    ['caixas', 'cx'],
    ['cx', 'cx'],
    ['dúzia', 'dz'],
    ['duzia', 'dz'],
    ['DÚZIAS', 'dz'],
    ['dz', 'dz'],
    [' kg ', 'kg'],
  ])('parseUnit(%j) -> %j', (input, expected) => {
    expect(parseUnit(input)).toBe(expected)
  })

  it.each(['', 'feijão', 'x', 'kgs', 'metro'])('parseUnit(%j) -> null', (input) => {
    expect(parseUnit(input)).toBeNull()
  })
})
