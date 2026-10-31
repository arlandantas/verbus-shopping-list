import { describe, expect, it } from 'vitest'
import { cycleOf, formatCycle, isCycle } from './cycle'

describe('S-035 AC1: cycle', () => {
  it('uses the local date', () => {
    expect(cycleOf(new Date(2026, 10, 1, 0, 30))).toBe('2026-11')
    expect(cycleOf(new Date(2026, 0, 31, 23, 59))).toBe('2026-01')
  })

  it('formats in pt-BR', () => {
    expect(formatCycle('2026-11')).toBe('novembro de 2026')
    expect(formatCycle('2026-03')).toBe('março de 2026')
  })

  it('validates the ADR-0012 pattern', () => {
    expect(isCycle('2026-11')).toBe(true)
    expect(isCycle('2026-12')).toBe(true)
    expect(isCycle('2026-00')).toBe(false)
    expect(isCycle('2026-13')).toBe(false)
    expect(isCycle('26-11')).toBe(false)
    expect(isCycle('2026-11-01')).toBe(false)
  })
})
