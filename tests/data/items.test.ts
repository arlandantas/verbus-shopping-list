import { collection, disableNetwork, enableNetwork, getDocs } from 'firebase/firestore'
import { db } from '@/data/firebase'
import type { CatalogEntry, Item } from '@/data/converters'
import {
  addItem,
  deleteItem,
  setItemPrice,
  setItemStatus,
  toggleItemStatus,
  updateItemDetails,
  watchItems,
} from '@/data/items'
import { watchCatalog } from '@/data/catalog'
import { clearFirestore, logout } from './support'
import { catDoc, current, flush, itemDoc, next, setup } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

describe('S-018 AC1: addItem', () => {
  it('writes item and catalog entry in one batch and returns the id synchronously', async () => {
    const { user, familyId } = await setup()
    const id = addItem(familyId, { name: 'Feijão', quantity: 2, unit: 'kg', recurring: true })
    expect(typeof id).toBe('string')
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({
      name: 'Feijão',
      nameKey: 'feijao',
      quantity: 2,
      unit: 'kg',
      note: null,
      categoryId: null,
      recurring: true,
      status: 'pending',
      markedBy: null,
      markedAt: null,
      priceCents: null,
      createdBy: user.uid,
    })
    expect(await catDoc(familyId, 'feijao')).toMatchObject({
      name: 'Feijão',
      nameKey: 'feijao',
      quantity: 2,
      unit: 'kg',
      categoryId: null,
    })
  })
})

describe('S-018 AC2: watchItems', () => {
  it('delivers pending by createdAt then bought by markedAt, with hasPendingWrites', async () => {
    const { familyId } = await setup()
    const a = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un' })
    const b = addItem(familyId, { name: 'Leite', quantity: 1, unit: 'l' })
    const c = addItem(familyId, { name: 'Pão', quantity: 1, unit: 'un' })
    await flush()
    setItemStatus(familyId, a, 'bought')
    await flush()
    const items = await next<Item[]>(
      (cb, err) => watchItems(familyId, cb, err),
      (l) => l.length === 3 && l.every((i) => !i.hasPendingWrites),
    )
    expect(items.map((i) => i.id)).toEqual([b, c, a])
    expect(items[2]!.markedAt).toBeInstanceOf(Date)
    expect(items.every((i) => i.hasPendingWrites === false)).toBe(true)
  })

  it('flags local writes as pending', async () => {
    const { familyId } = await setup()
    const seen: boolean[] = []
    const off = watchItems(familyId, (l) => l.forEach((i) => seen.push(i.hasPendingWrites)))
    addItem(familyId, { name: 'Ovos', quantity: 12, unit: 'un' })
    await flush()
    await new Promise((r) => setTimeout(r, 200))
    off()
    expect(seen).toContain(true)
  })
})

describe('S-018 AC3: updateItemDetails', () => {
  it('updates only given fields and syncs the catalog when quantity/unit/category change', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un' })
    await flush()
    updateItemDetails(familyId, id, { quantity: 5, unit: 'kg' }, current)
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({ name: 'Arroz', quantity: 5, unit: 'kg' })
    expect(await catDoc(familyId, 'arroz')).toMatchObject({
      quantity: 5,
      unit: 'kg',
      name: 'Arroz',
    })
  })

  it('leaves the catalog untouched when only the note changes', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un' })
    await flush()
    const before = await catDoc(familyId, 'arroz')
    updateItemDetails(familyId, id, { note: 'integral' }, current)
    await flush()
    expect((await itemDoc(familyId, id))?.note).toBe('integral')
    expect(await catDoc(familyId, 'arroz')).toEqual(before)
  })
})

describe('ADR-0004: updateItemDetails is synchronous and never reads', () => {
  it('returns void at once and still commits item + catalog while offline', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un' })
    await flush()
    await disableNetwork(db)
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    const result = updateItemDetails(familyId, id, { quantity: 3 }, current)
    expect(result).toBeUndefined()
    await new Promise((r) => setTimeout(r, 100))
    process.off('unhandledRejection', unhandled)
    expect(unhandled).not.toHaveBeenCalled()
    await enableNetwork(db)
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({ quantity: 3 })
    expect(await catDoc(familyId, 'arroz')).toMatchObject({ quantity: 3, unit: 'un' })
  })

  it('uses the new name for the catalog entry when the name changes', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un' })
    await flush()
    updateItemDetails(familyId, id, { name: 'Arroz integral', quantity: 2 }, current)
    await flush()
    expect(await catDoc(familyId, 'arroz integral')).toMatchObject({
      name: 'Arroz integral',
      quantity: 2,
      unit: 'un',
    })
  })
})

describe('S-018 AC4: setItemStatus and deleteItem', () => {
  it('marks bought, reverts to pending, and deletes', async () => {
    const { user, familyId } = await setup()
    const id = addItem(familyId, { name: 'Café', quantity: 1, unit: 'pct' })
    await flush()
    setItemStatus(familyId, id, 'bought')
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({ status: 'bought', markedBy: user.uid })
    expect((await itemDoc(familyId, id))?.markedAt).toBeTruthy()
    setItemStatus(familyId, id, 'pending')
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({
      status: 'pending',
      markedBy: null,
      markedAt: null,
    })
    deleteItem(familyId, id)
    await flush()
    expect(await itemDoc(familyId, id)).toBeUndefined()
  })
})

describe('S-018 AC5: watchCatalog', () => {
  it('keeps a single doc for Feijão and feijao, with the last spelling', async () => {
    const { familyId } = await setup()
    addItem(familyId, { name: 'Feijão', quantity: 1, unit: 'kg' })
    addItem(familyId, { name: 'feijao', quantity: 2, unit: 'kg' })
    await flush()
    const entries = await next<CatalogEntry[]>(
      (cb, err) => watchCatalog(familyId, cb, err),
      (l) => l.length > 0 && !l.some((e) => e.name === 'Feijão'),
    )
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ nameKey: 'feijao', name: 'feijao', quantity: 2 })
    expect((await getDocs(collection(db, 'families', familyId, 'catalog'))).size).toBe(1)
  })
})

describe('S-018 AC6: cross-family denial', () => {
  it('errors with permission-denied when watching another family', async () => {
    const { familyId } = await setup('ana')
    await logout()
    await setup('bia')
    const err = await new Promise<{ code?: string }>((resolve) => {
      watchItems(familyId, () => {}, resolve)
    })
    expect(err.code).toBe('permission-denied')
  })
})

describe('S-038 AC1: setItemPrice', () => {
  it('writes only priceCents on a bought item; null clears it', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un' })
    await flush()
    setItemStatus(familyId, id, 'bought')
    await flush()
    const before = await itemDoc(familyId, id)
    setItemPrice(familyId, id, 1290)
    await flush()
    expect(await itemDoc(familyId, id)).toEqual({ ...before, priceCents: 1290 })
    setItemPrice(familyId, id, null)
    await flush()
    expect(await itemDoc(familyId, id)).toEqual({ ...before, priceCents: null })
  })
})

describe('S-038 AC2: unmarking clears the price', () => {
  it('bought item with price -> toggleItemStatus -> pending with null price', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un' })
    await flush()
    setItemStatus(familyId, id, 'bought')
    setItemPrice(familyId, id, 1290)
    await flush()
    toggleItemStatus(familyId, { id, status: 'bought' })
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({
      status: 'pending',
      markedBy: null,
      markedAt: null,
      priceCents: null,
    })
  })
})
