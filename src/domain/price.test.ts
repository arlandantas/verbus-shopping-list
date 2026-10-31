import { describe, expect, it } from 'vitest'
import { formatBRL, parsePriceBRL } from './price'

describe('S-035 AC2: parsePriceBRL accepts', () => {
  it.each([
    ['12,90', 1290],
    ['12.90', 1290],
    ['R$ 12,90', 1290],
    ['1.234,50', 123450],
    ['7', 700],
  ])('%s -> %i', (input, cents) => {
    expect(parsePriceBRL(input)).toEqual({ ok: true, cents })
  })

  it('treats empty as null', () => {
    expect(parsePriceBRL('')).toEqual({ ok: true, cents: null })
    expect(parsePriceBRL('  ')).toEqual({ ok: true, cents: null })
  })
})

describe('S-035 AC3: parsePriceBRL rejects', () => {
  it.each(['abc', '-1', '12,999', '100000,01', '100.000,01'])('%s', (input) => {
    expect(parsePriceBRL(input)).toEqual({ ok: false, error: 'invalid' })
  })

  it('accepts the upper bound', () => {
    expect(parsePriceBRL('100000,00')).toEqual({ ok: true, cents: 10_000_000 })
  })
})

describe('S-035 AC4: formatBRL', () => {
  it('formats cents', () => {
    expect(formatBRL(1290).replace(/\s/g, ' ')).toBe('R$ 12,90')
    expect(formatBRL(123450).replace(/\s/g, ' ')).toBe('R$ 1.234,50')
  })
})
