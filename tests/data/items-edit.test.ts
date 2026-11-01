import { disableNetwork, enableNetwork } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { addItem, setItemPrice, updateItemDetails } from '@/data/items'
import { clearFirestore, logout } from './support'
import { catDoc, flush, itemDoc, setup } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

const cur = (recurring: boolean) => ({
  name: 'arroz',
  nameKey: 'arroz',
  quantity: 2,
  unit: 'kg' as const,
  categoryId: null,
  recurring,
})

async function seedArroz(recurring: boolean) {
  const { familyId, user } = await setup()
  const id = addItem(familyId, { name: 'arroz', quantity: 2, unit: 'kg', recurring })
  await flush()
  return { familyId, id, user }
}

describe('S-056 AC4: rename moves the catalog', () => {
  it('recurring item: new entry is recurring, old becomes false', async () => {
    const { familyId, id } = await seedArroz(true)
    updateItemDetails(familyId, id, { name: 'Arroz integral' }, cur(true))
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({
      name: 'Arroz integral',
      nameKey: 'arroz integral',
    })
    expect(await catDoc(familyId, 'arroz integral')).toMatchObject({
      name: 'Arroz integral',
      quantity: 2,
      unit: 'kg',
      categoryId: null,
      recurring: true,
    })
    expect(await catDoc(familyId, 'arroz')).toMatchObject({ recurring: false })
  })

  it('non-recurring item: old entry stays intact', async () => {
    const { familyId, id } = await seedArroz(false)
    const before = await catDoc(familyId, 'arroz')
    updateItemDetails(familyId, id, { name: 'Arroz integral' }, cur(false))
    await flush()
    expect(await catDoc(familyId, 'arroz integral')).toMatchObject({ recurring: false })
    expect(await catDoc(familyId, 'arroz')).toEqual(before)
  })
})

describe('S-056 AC5: case/accent-only rename', () => {
  it('keeps the same nameKey and the catalog recurring', async () => {
    const { familyId, id } = await seedArroz(true)
    updateItemDetails(familyId, id, { name: 'Arroz' }, cur(true))
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({ name: 'Arroz', nameKey: 'arroz' })
    expect(await catDoc(familyId, 'arroz')).toMatchObject({ recurring: true })
  })
})

describe('S-056 AC6: price and status are independent', () => {
  it('setItemPrice on a pending item writes only priceCents', async () => {
    const { familyId, id } = await seedArroz(false)
    const before = await itemDoc(familyId, id)
    setItemPrice(familyId, id, 1290)
    await flush()
    expect(await itemDoc(familyId, id)).toEqual({ ...before, priceCents: 1290 })
  })

  it('price without status change leaves status fields alone', async () => {
    const { familyId, id } = await seedArroz(false)
    const before = await itemDoc(familyId, id)
    updateItemDetails(familyId, id, { priceCents: 500 }, cur(false))
    await flush()
    expect(await itemDoc(familyId, id)).toEqual({ ...before, priceCents: 500 })
  })

  it('status bought stamps markedBy/markedAt; pending clears them and keeps the price', async () => {
    const { familyId, id, user } = await seedArroz(false)
    updateItemDetails(familyId, id, { status: 'bought', priceCents: 700 }, cur(false))
    await flush()
    const bought = await itemDoc(familyId, id)
    expect(bought).toMatchObject({ status: 'bought', markedBy: user.uid, priceCents: 700 })
    expect(bought?.markedAt).toBeTruthy()
    updateItemDetails(familyId, id, { status: 'pending' }, cur(false))
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({
      status: 'pending',
      markedBy: null,
      markedAt: null,
      priceCents: 700,
    })
  })

  it('works offline without awaiting', async () => {
    const { familyId, id } = await seedArroz(false)
    await disableNetwork(db)
    expect(updateItemDetails(familyId, id, { status: 'bought', priceCents: 100 }, cur(false))).toBe(
      undefined,
    )
    await enableNetwork(db)
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({ status: 'bought', priceCents: 100 })
  })
})
