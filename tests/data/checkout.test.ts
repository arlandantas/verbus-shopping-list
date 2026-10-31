import { collection, getDocs, waitForPendingWrites } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { addItem, setItemPrice, setItemStatus, watchItems } from '@/data/items'
import { checkout, CHECKOUT_CHUNK } from '@/data/checkout'
import { setWriteErrorHandler } from '@/data/writeErrors'
import type { Category, Item } from '@/data/converters'
import { cycleOf } from '@/domain/cycle'
import { clearFirestore, logout } from './support'
import { flush, next, setup } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})
afterEach(() => setWriteErrorHandler())

const col = async (f: string, name: string) =>
  (await getDocs(collection(db, 'families', f, name))).docs.map((d) => ({ id: d.id, ...d.data() }))

async function loadItems(familyId: string, n: number): Promise<Item[]> {
  return next<Item[]>(
    (cb, err) => watchItems(familyId, cb, err),
    (l) => l.length === n,
  )
}

const cats = (...c: [string, string][]): Category[] =>
  c.map(([id, name], order) => ({ id, name, isDefault: false, order }))

describe('S-039 AC1: checkout', () => {
  it('archives bought items into one purchase and lines, leaving pending', async () => {
    const { familyId, user } = await setup()
    const ids = ['Arroz', 'Feijão', 'Leite'].map((name) =>
      addItem(familyId, { name, quantity: 1, unit: 'un', categoryId: 'c1' }),
    )
    const pending = addItem(familyId, { name: 'Pão', quantity: 1, unit: 'un' })
    await flush()
    ids.forEach((id) => setItemStatus(familyId, id, 'bought'))
    setItemPrice(familyId, ids[0], 1250)
    await flush()
    const all = await loadItems(familyId, 4)
    const bought = all.filter((i) => i.status === 'bought')
    checkout(familyId, bought, { market: 'Atacadão', categories: cats(['c1', 'Mercearia']) })
    await flush()
    const purchases = await col(familyId, 'purchases')
    expect(purchases).toHaveLength(1)
    expect(purchases[0]).toMatchObject({
      itemCount: 3,
      totalCents: 1250,
      cycle: cycleOf(new Date()),
      market: 'Atacadão',
      createdBy: user.uid,
    })
    const lines = await col(familyId, 'purchaseLines')
    expect(lines.map((l) => l.id).sort()).toEqual([...ids].sort())
    expect(lines.every((l) => (l as { categoryName?: string }).categoryName === 'Mercearia')).toBe(
      true,
    )
    expect(lines.every((l) => (l as { purchaseId?: string }).purchaseId === purchases[0].id)).toBe(
      true,
    )
    const left = await col(familyId, 'items')
    expect(left.map((i) => i.id)).toEqual([pending])
  })
})

describe('S-039 AC2: normalisation', () => {
  it('null total without prices, blank market -> null, orphan category -> null name', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un', categoryId: 'gone' })
    await flush()
    setItemStatus(familyId, id, 'bought')
    await flush()
    const bought = await loadItems(familyId, 1)
    checkout(familyId, bought, { market: '  ', categories: [] })
    await flush()
    const [p] = await col(familyId, 'purchases')
    expect(p).toMatchObject({ totalCents: null, market: null, itemCount: 1 })
    const [l] = await col(familyId, 'purchaseLines')
    expect(l).toMatchObject({ categoryName: null, market: null, priceCents: null })
  })
})

describe('S-039 AC3: chunking', () => {
  it('250 bought -> 2 purchases (200 + 50), 250 lines, no items left', async () => {
    const { familyId } = await setup()
    for (let i = 0; i < 250; i++) addItem(familyId, { name: `Item ${i}`, quantity: 1, unit: 'un' })
    await flush()
    const all = await loadItems(familyId, 250)
    all.forEach((i) => setItemStatus(familyId, i.id, 'bought'))
    await flush()
    const bought = (await loadItems(familyId, 250)).filter((i) => i.status === 'bought')
    expect(bought).toHaveLength(250)
    checkout(familyId, bought, { market: null, categories: [] })
    await waitForPendingWrites(db)
    const purchases = await col(familyId, 'purchases')
    expect(
      purchases
        .map((p) => (p as { itemCount?: number }).itemCount)
        .sort((a, b) => (a ?? 0) - (b ?? 0)),
    ).toEqual([50, CHECKOUT_CHUNK])
    expect(await col(familyId, 'purchaseLines')).toHaveLength(250)
    expect(await col(familyId, 'items')).toHaveLength(0)
  }, 60000)
})

describe('S-039 AC4: retry / double checkout', () => {
  it('second checkout of the same items is denied whole and reported', async () => {
    const { familyId } = await setup()
    const ids = ['A', 'B', 'C'].map((name) => addItem(familyId, { name, quantity: 1, unit: 'un' }))
    await flush()
    ids.forEach((id) => setItemStatus(familyId, id, 'bought'))
    await flush()
    const bought = await loadItems(familyId, 3)
    const errors: unknown[] = []
    setWriteErrorHandler((e) => errors.push(e))
    checkout(familyId, bought, { market: null, categories: [] })
    checkout(familyId, bought, { market: null, categories: [] })
    await vi.waitFor(() => expect(errors).toHaveLength(1), { timeout: 10000 })
    await flush().catch(() => {})
    expect(await col(familyId, 'purchases')).toHaveLength(1)
    expect(await col(familyId, 'purchaseLines')).toHaveLength(3)
  })
})
