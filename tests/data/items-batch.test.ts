import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { addItem, addItems } from '@/data/items'
import { clearFirestore, logout } from './support'
import { catDoc, flush, setup } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

describe('S-093 AC7: addItems', () => {
  it('accepts 100 items in one batch', async () => {
    const { familyId } = await setup()
    const inputs = Array.from({ length: 100 }, (_, i) => ({
      name: `Item ${i}`,
      quantity: 1,
      unit: 'un' as const,
    }))
    const ids = addItems(familyId, inputs)
    expect(new Set(ids).size).toBe(100)
    await flush()
    const snap = await getDocs(collection(db, 'families', familyId, 'items'))
    expect(snap.size).toBe(100)
    expect((await catDoc(familyId, 'item 7'))?.name).toBe('Item 7')
  })

  it('keeps catalog recurring when the entry does not carry it', async () => {
    const { familyId } = await setup()
    addItem(familyId, { name: 'Arroz', quantity: 1, unit: 'un', recurring: true })
    addItems(familyId, [{ name: 'Arroz', quantity: 2, unit: 'kg' }])
    await flush()
    expect(await catDoc(familyId, 'arroz')).toMatchObject({ quantity: 2, recurring: true })
  })
})
