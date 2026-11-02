import { cycleTotalCents, cyclesFrom, groupByPurchase, knownMarkets } from '@/domain/history'

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

describe('S-066 AC1: groupByPurchase', () => {
  const ln = (id: string, purchaseId: string, priceCents: number | null) => ({
    id,
    name: `n${id}`,
    purchaseId,
    priceCents,
  })
  it('orders purchases newest first with market, total, count and lines', () => {
    const groups = groupByPurchase(
      [ln('1', 'a', 500), ln('2', 'b', null), ln('3', 'a', 250)],
      [
        p('2026-11', '2026-11-05T10:00:00Z', 'Mercado A', null),
        { ...p('2026-11', '2026-11-12T10:00:00Z', null, null), id: 'b' },
      ].map((x, i) => (i === 0 ? { ...x, id: 'a' } : x)),
    )
    expect(groups.map((g) => g.id)).toEqual(['b', 'a'])
    expect(groups[0]).toMatchObject({ market: null, totalCents: null, itemCount: 1 })
    expect(groups[1]).toMatchObject({ market: 'Mercado A', totalCents: 750, itemCount: 2 })
    expect(groups[1]!.lines.map((l) => l.id)).toEqual(['1', '3'])
  })
  it('puts lines without a known purchase in a trailing group', () => {
    const groups = groupByPurchase([ln('1', 'zzz', 100)], [])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ id: null, purchasedAt: null, totalCents: 100, itemCount: 1 })
  })
  it('returns nothing without lines or purchases', () => {
    expect(groupByPurchase([], [])).toEqual([])
  })
})
