import { describe, expect, it } from 'vitest'
import { toNameKey } from './nameKey'

const ADR_REGEX = /^[a-z0-9]+( [a-z0-9]+)*$/

describe('S-017 AC4: toNameKey', () => {
  it.each([
    ['  Pão de Forma ', 'pao de forma'],
    ['Leite 1/2', 'leite 1 2'],
    ['AÇÚCAR', 'acucar'],
    ['feijão-preto!!', 'feijao preto'],
    ['   ', ''],
    ['', ''],
    ['!!!', ''],
  ])('toNameKey(%j) -> %j', (input, expected) => {
    expect(toNameKey(input)).toBe(expected)
  })

  it('always matches the ADR-0008 regex and is <= 80 chars', () => {
    const inputs = [
      'Pão de Forma',
      'a'.repeat(200),
      'ab '.repeat(60),
      'x-'.repeat(100),
      'Ünï çødé 123',
    ]
    for (const input of inputs) {
      const key = toNameKey(input)
      expect(key).toMatch(ADR_REGEX)
      expect(key.length).toBeLessThanOrEqual(80)
    }
  })

  it('does not leave a trailing space after truncation', () => {
    const key = toNameKey('a'.repeat(79) + ' bbb')
    expect(key).toBe('a'.repeat(79))
  })
})
