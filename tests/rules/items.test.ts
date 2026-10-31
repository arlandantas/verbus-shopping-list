import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { asUser } from './support'
import {
  UNITS,
  seedItem,
  alice as aliceOf,
  itemRef,
  newItem,
  seedItems,
  setupItemsEnv,
} from './itemsSupport'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupItemsEnv('demo-verbus-items')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await seedItems(env)
})

const alice = () => aliceOf(env)
const item = itemRef

describe('S-015 AC1: creating valid items', () => {
  it('allows the minimal item', async () => {
    await assertSucceeds(setDoc(item(alice(), 'n1'), newItem()))
  })

  it('allows a complete item', async () => {
    await assertSucceeds(
      setDoc(
        item(alice(), 'n1'),
        newItem({
          name: 'Arroz integral',
          nameKey: 'arroz integral',
          quantity: 0.5,
          unit: 'kg',
          note: 'marca X',
          categoryId: 'cat1',
          recurring: true,
        }),
      ),
    )
  })

  it.each(UNITS)('accepts unit %s', async (unit) => {
    await assertSucceeds(setDoc(item(alice(), 'n1'), newItem({ unit })))
  })

  it('accepts boundary values', async () => {
    await assertSucceeds(
      setDoc(
        item(alice(), 'n1'),
        newItem({
          name: 'x'.repeat(80),
          nameKey: 'y'.repeat(80),
          quantity: 9999,
          note: 'n'.repeat(120),
        }),
      ),
    )
  })
})

describe('S-015 AC2: denied creates', () => {
  const bad: Array<[string, Record<string, unknown>]> = [
    ['extra key', { extra: 1 }],
    ['empty name', { name: '' }],
    ['name > 80', { name: 'x'.repeat(81) }],
    ['non-string name', { name: 5 }],
    ['nameKey uppercase', { nameKey: 'Leite' }],
    ['nameKey with accent', { nameKey: 'pão' }],
    ['nameKey double space', { nameKey: 'a  b' }],
    ['nameKey trailing space', { nameKey: 'a ' }],
    ['empty nameKey', { nameKey: '' }],
    ['nameKey > 80', { nameKey: 'a'.repeat(81) }],
    ['quantity 0', { quantity: 0 }],
    ['negative quantity', { quantity: -1 }],
    ['quantity > 9999', { quantity: 10000 }],
    ['string quantity', { quantity: '1' }],
    ['unknown unit', { unit: 'lb' }],
    ['uppercase unit', { unit: 'L' }],
    ['note > 120', { note: 'n'.repeat(121) }],
    ['non-string note', { note: 3 }],
    ['empty categoryId', { categoryId: '' }],
    ['categoryId > 40', { categoryId: 'c'.repeat(41) }],
    ['non-bool recurring', { recurring: 'yes' }],
    ['status bought', { status: 'bought' }],
    ['unknown status', { status: 'done' }],
    ['markedBy set', { markedBy: 'alice' }],
    ['markedAt set', { markedAt: serverTimestamp() }],
    ['priceCents set', { priceCents: 100 }],
    ['createdBy other uid', { createdBy: 'dave' }],
    ['createdAt client date', { createdAt: new Date() }],
  ]
  it.each(bad)('denies %s', async (_n, over) => {
    await assertFails(setDoc(item(alice(), 'n1'), newItem(over)))
  })

  it.each(['name', 'nameKey', 'quantity', 'unit', 'note', 'recurring', 'status', 'priceCents'])(
    'denies a missing %s key',
    async (key) => {
      const data: Record<string, unknown> = newItem()
      delete data[key]
      await assertFails(setDoc(item(alice(), 'n1'), data))
    },
  )
})

describe('S-015 AC3: field-level updates', () => {
  it.each([
    ['quantity', { quantity: 2.5 }],
    ['unit', { unit: 'kg' }],
    ['note', { note: 'integral' }],
    ['recurring', { recurring: true }],
  ])('allows updating %s', async (_n, patch) => {
    await assertSucceeds(updateDoc(item(alice()), patch))
  })

  it('denies changing createdBy or createdAt', async () => {
    await assertFails(updateDoc(item(alice()), { createdBy: 'dave' }))
    await assertFails(updateDoc(item(alice()), { createdAt: serverTimestamp() }))
    await assertFails(updateDoc(item(alice()), { createdAt: new Date() }))
  })

  it('denies invalid shapes', async () => {
    await assertFails(updateDoc(item(alice()), { quantity: 0 }))
    await assertFails(updateDoc(item(alice()), { quantity: 10000 }))
    await assertFails(updateDoc(item(alice()), { unit: 'lb' }))
    await assertFails(updateDoc(item(alice()), { note: 'n'.repeat(121) }))
    await assertFails(updateDoc(item(alice()), { name: '' }))
    await assertFails(updateDoc(item(alice()), { nameKey: 'Bad Key' }))
    await assertFails(updateDoc(item(alice()), { recurring: 'x' }))
    await assertFails(updateDoc(item(alice()), { extra: 1 }))
  })

  it('denies removing a required key via a full replace', async () => {
    const data: Record<string, unknown> = seedItem()
    delete data.unit
    await assertFails(setDoc(item(alice()), data))
  })
})

describe('S-015 AC4: marking bought and reverting', () => {
  it('allows marking bought with own uid and serverTimestamp', async () => {
    await assertSucceeds(
      updateDoc(item(alice()), {
        status: 'bought',
        markedBy: 'alice',
        markedAt: serverTimestamp(),
      }),
    )
  })

  it('denies marking with another uid', async () => {
    await assertFails(
      updateDoc(item(alice()), { status: 'bought', markedBy: 'dave', markedAt: serverTimestamp() }),
    )
  })

  it('denies marking without markedAt or with a client date', async () => {
    await assertFails(updateDoc(item(alice()), { status: 'bought', markedBy: 'alice' }))
    await assertFails(
      updateDoc(item(alice()), { status: 'bought', markedBy: 'alice', markedAt: new Date() }),
    )
  })

  it('denies a field-level status flip without markedBy/markedAt', async () => {
    await assertFails(updateDoc(item(alice()), { status: 'bought' }))
  })

  it('denies setting markedBy/markedAt while staying pending', async () => {
    await assertFails(updateDoc(item(alice()), { markedBy: 'alice', markedAt: serverTimestamp() }))
    await assertFails(updateDoc(item(alice()), { markedBy: 'alice' }))
  })

  it('denies an unknown status value', async () => {
    await assertFails(
      updateDoc(item(alice()), { status: 'done', markedBy: 'alice', markedAt: serverTimestamp() }),
    )
  })

  it('allows reverting to pending with null markers', async () => {
    await assertSucceeds(
      updateDoc(item(alice(), 'bought'), { status: 'pending', markedBy: null, markedAt: null }),
    )
  })

  it('denies reverting to pending without clearing markers', async () => {
    await assertFails(updateDoc(item(alice(), 'bought'), { status: 'pending' }))
    await assertFails(updateDoc(item(alice(), 'bought'), { status: 'pending', markedBy: null }))
    await assertFails(
      updateDoc(item(alice(), 'bought'), { status: 'pending', markedBy: 'alice', markedAt: null }),
    )
  })

  it('allows a re-mark by another member (last mark wins)', async () => {
    await assertSucceeds(
      updateDoc(item(asUser(env, 'dave'), 'bought'), {
        status: 'bought',
        markedBy: 'dave',
        markedAt: serverTimestamp(),
      }),
    )
  })
})
