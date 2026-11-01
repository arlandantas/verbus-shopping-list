import { collection, disableNetwork, enableNetwork, getDocs } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { addItem, deleteItem, setItemStatus } from '@/data/items'
import { openCycleIfNeeded } from '@/data/cycles'
import { setWriteErrorHandler } from '@/data/writeErrors'
import { clearFirestore, logout } from './support'
import { flush, setup } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})
afterEach(async () => {
  // let the SDK finish tearing down the server-read listeners before the next test signs out
  await new Promise((r) => setTimeout(r, 100))
  setWriteErrorHandler()
  await enableNetwork(db)
})

const col = async (f: string, name: string) =>
  (await getDocs(collection(db, 'families', f, name))).docs.map((d) => ({ id: d.id, ...d.data() }))

/** 3 recurring (atHome, missing, inCart) + 1 non-recurring pending. */
async function seed(familyId: string) {
  const home = addItem(familyId, {
    name: 'Arroz',
    quantity: 5,
    unit: 'kg',
    categoryId: 'c1',
    recurring: true,
  })
  addItem(familyId, { name: 'Feijão', quantity: 1, unit: 'un', recurring: true })
  const cart = addItem(familyId, { name: 'Leite', quantity: 2, unit: 'l', recurring: true })
  addItem(familyId, { name: 'Pão', quantity: 1, unit: 'un' })
  await flush()
  deleteItem(familyId, home)
  setItemStatus(familyId, cart, 'bought')
  await flush()
}

describe('S-041 AC1: opens the cycle and returns at-home recurring', () => {
  it('creates the marker and one pending item from the catalog', async () => {
    const { familyId, user } = await setup()
    await seed(familyId)
    await openCycleIfNeeded(familyId, '2026-12')
    const [marker] = await col(familyId, 'cycles')
    expect(marker).toMatchObject({ id: '2026-12', openedBy: user.uid, recurringAdded: 1 })
    const items = await col(familyId, 'items')
    expect(items).toHaveLength(4)
    const arroz = items.filter((i) => (i as { nameKey?: string }).nameKey === 'arroz')
    expect(arroz).toHaveLength(1)
    expect(arroz[0]).toMatchObject({
      name: 'Arroz',
      quantity: 5,
      unit: 'kg',
      categoryId: 'c1',
      recurring: true,
      status: 'pending',
      markedBy: null,
      createdBy: user.uid,
    })
  })
})

describe('S-041 AC2: no duplicates, no reported error', () => {
  it('a second call and two concurrent calls add nothing more', async () => {
    const { familyId } = await setup()
    await seed(familyId)
    const errors: unknown[] = []
    setWriteErrorHandler((e) => errors.push(e))
    const results = await Promise.all([
      openCycleIfNeeded(familyId, '2026-12'),
      openCycleIfNeeded(familyId, '2026-12'),
    ])
    await openCycleIfNeeded(familyId, '2026-12')
    expect(results.map((r) => r.added).sort()).toEqual([0, 1])
    expect(await col(familyId, 'cycles')).toHaveLength(1)
    expect(await col(familyId, 'items')).toHaveLength(4)
    expect(errors).toEqual([])
  })

  it('a recurring entry already pending is not duplicated', async () => {
    const { familyId } = await setup()
    addItem(familyId, { name: 'Feijão', quantity: 1, unit: 'un', recurring: true })
    await flush()
    expect(await openCycleIfNeeded(familyId, '2026-12')).toMatchObject({ added: 0 })
    expect(await col(familyId, 'items')).toHaveLength(1)
    expect((await col(familyId, 'cycles'))[0]).toMatchObject({ recurringAdded: 0 })
  })
})

describe('S-041 AC3: result', () => {
  it('returns added, and skipped when the month was already open', async () => {
    const { familyId } = await setup()
    await seed(familyId)
    expect(await openCycleIfNeeded(familyId, '2026-12')).toEqual({ added: 1 })
    expect(await openCycleIfNeeded(familyId, '2026-12')).toEqual({ added: 0, skipped: true })
  })

  it('first access of a family with nothing recurring still creates the marker', async () => {
    const { familyId } = await setup()
    expect(await openCycleIfNeeded(familyId, '2026-12')).toEqual({ added: 0 })
    expect(await col(familyId, 'cycles')).toHaveLength(1)
  })
})

describe('S-041 AC3: offline', () => {
  it('does nothing while offline (no marker, no items)', async () => {
    const { familyId } = await setup()
    await seed(familyId)
    await disableNetwork(db)
    expect(await openCycleIfNeeded(familyId, '2026-12')).toEqual({ added: 0, skipped: true })
    await enableNetwork(db)
    await flush()
    expect(await col(familyId, 'cycles')).toHaveLength(0)
    expect(await col(familyId, 'items')).toHaveLength(3)
  })
})

describe('S-041 AC1: batch limit', () => {
  it('caps at 400 items (+1 marker) so the batch stays under 500 writes', async () => {
    const { familyId } = await setup()
    for (let i = 0; i < 405; i++)
      addItem(familyId, { name: `Rec ${i}`, quantity: 1, unit: 'un', recurring: true })
    await flush()
    const all = await col(familyId, 'items')
    all.forEach((i) => deleteItem(familyId, i.id))
    await flush()
    expect(await openCycleIfNeeded(familyId, '2026-12')).toEqual({ added: 400 })
    expect(await col(familyId, 'items')).toHaveLength(400)
  }, 90000)
})
