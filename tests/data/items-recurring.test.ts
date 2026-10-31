import type { Item } from '@/data/converters'
import { addItem, setRecurring, updateItemDetails, watchItems } from '@/data/items'
import { clearFirestore, logout } from './support'
import { catDoc, flush, itemDoc, next, setup, current } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

describe('S-023 AC2: catalog writes merge', () => {
  it('keeps recurring true after re-adding the same name without recurring', async () => {
    const { familyId } = await setup()
    addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un', recurring: true })
    await flush()
    addItem(familyId, { name: 'arroz', quantity: 3, unit: 'kg' })
    await flush()
    expect(await catDoc(familyId, 'arroz')).toMatchObject({
      name: 'arroz',
      quantity: 3,
      unit: 'kg',
      recurring: true,
    })
  })

  it('updateItemDetails on quantity keeps catalog recurring', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un', recurring: true })
    await flush()
    updateItemDetails(familyId, id, { quantity: 4 }, current)
    await flush()
    expect(await catDoc(familyId, 'arroz')).toMatchObject({ quantity: 4, recurring: true })
  })
})

describe('S-023 AC3: updateItemDetails with recurring', () => {
  it('writes item and catalog recurring in the same batch', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un' })
    await flush()
    updateItemDetails(familyId, id, { recurring: true }, current)
    await flush()
    expect(await itemDoc(familyId, id)).toMatchObject({ recurring: true })
    expect(await catDoc(familyId, 'arroz')).toMatchObject({ recurring: true, quantity: 1 })
  })
})

describe('S-023 AC4: setRecurring', () => {
  it('turns recurring off on catalog and all items with the nameKey', async () => {
    const { familyId } = await setup()
    const a = addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un', recurring: true })
    const b = addItem(familyId, { name: 'arroz', quantity: 1, unit: 'un', recurring: true })
    const c = addItem(familyId, { name: 'Leite', quantity: 1, unit: 'l', recurring: true })
    await flush()
    const items = await next<Item[]>(
      (cb, err) => watchItems(familyId, cb, err),
      (l) => l.length === 3 && l.every((i) => !i.hasPendingWrites),
    )
    const result = setRecurring(familyId, 'arroz', false, items)
    expect(result).toBeUndefined()
    await flush()
    expect(await catDoc(familyId, 'arroz')).toMatchObject({ recurring: false, name: 'arroz' })
    expect(await itemDoc(familyId, a)).toMatchObject({ recurring: false })
    expect(await itemDoc(familyId, b)).toMatchObject({ recurring: false })
    expect(await itemDoc(familyId, c)).toMatchObject({ recurring: true })
    expect(await catDoc(familyId, 'leite')).toMatchObject({ recurring: true })
  })
})
