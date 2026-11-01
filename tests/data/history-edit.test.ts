import { disableNetwork, doc, enableNetwork, getDoc } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { addItem, setItemPrice, setItemStatus, watchItems } from '@/data/items'
import { checkout } from '@/data/checkout'
import { updatePurchaseLine, watchCycleLines } from '@/data/history'
import type { Item, PurchaseLine } from '@/data/converters'
import { clearFirestore, logout } from './support'
import { flush, next, setup } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

/** One purchase with Arroz (10,00) and Leite (no price). */
async function seedPurchase() {
  const { familyId } = await setup()
  const ids = [
    addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un' }),
    addItem(familyId, { name: 'Leite', quantity: 1, unit: 'un' }),
  ]
  await flush()
  for (const id of ids) setItemStatus(familyId, id, 'bought')
  setItemPrice(familyId, ids[0], 1000)
  await flush()
  const items = await next<Item[]>(
    (cb, err) => watchItems(familyId, cb, err),
    (l) => l.filter((i) => i.status === 'bought').length === 2,
  )
  checkout(familyId, items, { market: 'A', categories: [], now: new Date(2026, 10, 5) })
  await flush()
  const lines = await next<PurchaseLine[]>(
    (cb, err) => watchCycleLines(familyId, '2026-11', cb, err),
    (l) => l.length === 2,
  )
  return { familyId, lines }
}

const total = async (familyId: string, purchaseId: string) =>
  (await getDoc(doc(db, 'families', familyId, 'purchases', purchaseId))).data()?.totalCents

describe('S-067 AC5: updatePurchaseLine', () => {
  it('writes the line and the recomputed purchase total; null when no line has a price', async () => {
    const { familyId, lines } = await seedPurchase()
    const arroz = lines.find((l) => l.name === 'Arroz')!
    const leite = lines.find((l) => l.name === 'Leite')!
    expect(updatePurchaseLine(familyId, leite, { priceCents: 290, quantity: 2 }, lines)).toBe(
      undefined,
    )
    await flush()
    const snap = await getDoc(doc(db, 'families', familyId, 'purchaseLines', leite.id))
    expect(snap.data()).toMatchObject({ priceCents: 290, quantity: 2, name: 'Leite' })
    expect(await total(familyId, leite.purchaseId)).toBe(1290)

    const fresh = lines.map((l) => (l.id === leite.id ? { ...l, priceCents: 290 } : l))
    updatePurchaseLine(familyId, arroz, { priceCents: null }, fresh)
    const cleared = fresh.map((l) => (l.id === arroz.id ? { ...l, priceCents: null } : l))
    updatePurchaseLine(familyId, leite, { priceCents: null }, cleared)
    await flush()
    expect(await total(familyId, leite.purchaseId)).toBeNull()
  })
})

describe('S-067 AC6: offline', () => {
  it('shows the edit locally at once and syncs on reconnect', async () => {
    const { familyId, lines } = await seedPurchase()
    const leite = lines.find((l) => l.name === 'Leite')!
    await disableNetwork(db)
    updatePurchaseLine(familyId, leite, { priceCents: 500 }, lines)
    const local = await next<PurchaseLine[]>(
      (cb, err) => watchCycleLines(familyId, '2026-11', cb, err),
      (l) => l.some((x) => x.id === leite.id && x.priceCents === 500),
    )
    expect(local).toHaveLength(2)
    await enableNetwork(db)
    await flush()
    expect(await total(familyId, leite.purchaseId)).toBe(1500)
  })
})
