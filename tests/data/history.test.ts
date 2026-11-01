import { addItem, setItemPrice, setItemStatus, watchItems } from '@/data/items'
import { checkout } from '@/data/checkout'
import { watchCycleLines, watchPurchases } from '@/data/history'
import type { Item, Purchase, PurchaseLine } from '@/data/converters'
import { cyclesFrom } from '@/domain/history'
import { clearFirestore, logout } from './support'
import { flush, next, setup } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

async function buy(familyId: string, name: string, cents: number, market: string, now: Date) {
  const id = addItem(familyId, { name, quantity: 1, unit: 'un' })
  await flush()
  setItemStatus(familyId, id, 'bought')
  setItemPrice(familyId, id, cents)
  await flush()
  const items = await next<Item[]>(
    (cb, err) => watchItems(familyId, cb, err),
    (l) => l.some((i) => i.id === id && i.status === 'bought'),
  )
  checkout(
    familyId,
    items.filter((i) => i.id === id),
    { market, categories: [], now },
  )
  await flush()
}

describe('S-040 AC1: watchPurchases', () => {
  it('delivers purchases by purchasedAt desc; cyclesFrom groups months', async () => {
    const { familyId } = await setup()
    await buy(familyId, 'Arroz', 1000, 'A', new Date(2026, 9, 5))
    await buy(familyId, 'Leite', 500, 'B', new Date(2026, 10, 5))
    await buy(familyId, 'Pão', 250, 'A', new Date(2026, 10, 6))
    const list = await next<Purchase[]>(
      (cb, err) => watchPurchases(familyId, cb, err),
      (l) => l.length === 3,
    )
    const times = list.map((p) => p.purchasedAt.getTime())
    expect(times).toEqual([...times].sort((a, b) => b - a))
    expect(list[0].market).toBe('A')
    expect(cyclesFrom(list)).toEqual([
      { cycle: '2026-11', totalCents: 750, purchaseCount: 2, itemCount: 2 },
      { cycle: '2026-10', totalCents: 1000, purchaseCount: 1, itemCount: 1 },
    ])
  })
})

describe('S-040 AC2: watchCycleLines', () => {
  it('delivers only the lines of that month', async () => {
    const { familyId } = await setup()
    await buy(familyId, 'Arroz', 1000, 'A', new Date(2026, 9, 5))
    await buy(familyId, 'Leite', 500, 'B', new Date(2026, 10, 5))
    const lines = await next<PurchaseLine[]>(
      (cb, err) => watchCycleLines(familyId, '2026-11', cb, err),
      (l) => l.length === 1,
    )
    expect(lines[0]).toMatchObject({
      name: 'Leite',
      cycle: '2026-11',
      priceCents: 500,
      market: 'B',
    })
  })
})
