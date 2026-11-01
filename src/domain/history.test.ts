import { cycleTotalCents, cyclesFrom, knownMarkets } from '@/domain/history'

const p = (cycle: string, at: string, market: string | null, totalCents: number | null, n = 1) => ({
  id: `${cycle}-${at}`,
  cycle,
  market,
  itemCount: n,
  totalCents,
  purchasedAt: new Date(at),
})

describe('cyclesFrom', () => {
  it('S-040 AC1: distinct months desc with total and counts', () => {
    const out = cyclesFrom([
      p('2026-11', '2026-11-20', 'A', 500, 2),
      p('2026-10', '2026-10-05', 'B', null, 1),
      p('2026-11', '2026-11-02', 'A', 250, 3),
    ])
    expect(out).toEqual([
      { cycle: '2026-11', totalCents: 750, purchaseCount: 2, itemCount: 5 },
      { cycle: '2026-10', totalCents: 0, purchaseCount: 1, itemCount: 1 },
    ])
  })

  it('S-040 AC1: empty input', () => {
    expect(cyclesFrom([])).toEqual([])
  })
})

describe('cycleTotalCents', () => {
  it('S-040 AC1: ADR-0016 sums line prices, ignoring nulls', () => {
    expect(cycleTotalCents([{ priceCents: 100 }, { priceCents: null }, { priceCents: 50 }])).toBe(
      150,
    )
  })
})

describe('knownMarkets', () => {
  it('S-040 AC3: distinct, case/accent-insensitive, recent first, no null', () => {
    const out = knownMarkets([
      p('2026-11', '2026-11-20', 'Pão de Açúcar', 1),
      p('2026-11', '2026-11-18', null, 1),
      p('2026-11', '2026-11-10', 'pao de acucar', 1),
      p('2026-10', '2026-10-01', 'Atacadão', 1),
    ])
    expect(out).toEqual(['Pão de Açúcar', 'Atacadão'])
  })
})
