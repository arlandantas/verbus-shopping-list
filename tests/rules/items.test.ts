import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { anon, asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'pct', 'cx', 'dz']

const seedItem = (over: Record<string, unknown> = {}) => ({
  name: 'Leite',
  nameKey: 'leite',
  quantity: 1,
  unit: 'un',
  note: null,
  categoryId: null,
  recurring: false,
  status: 'pending',
  markedBy: null,
  markedAt: null,
  priceCents: null,
  createdBy: 'alice',
  createdAt: new Date(),
  ...over,
})

const newItem = (over: Record<string, unknown> = {}) => ({
  ...seedItem(),
  createdAt: serverTimestamp(),
  ...over,
})

beforeAll(async () => {
  env = await setupEnv('demo-verbus-items')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': {
      name: 'Casa',
      members: ['alice', 'dave'],
      ownerId: 'alice',
      createdAt: new Date(),
    },
    'families/F1/items/x': seedItem(),
    'families/F1/items/bought': seedItem({
      status: 'bought',
      markedBy: 'alice',
      markedAt: new Date(),
    }),
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    'families/F2/items/y': seedItem({ createdBy: 'bob' }),
  })
})

const alice = () => asUser(env, 'alice')
const item = (db: ReturnType<typeof alice>, id = 'x') => doc(db, `families/F1/items/${id}`)

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
    await assertFails(
      updateDoc(item(alice()), { markedBy: 'alice', markedAt: serverTimestamp() }),
    )
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
    await assertFails(
      updateDoc(item(alice(), 'bought'), { status: 'pending', markedBy: null }),
    )
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

describe('S-015 AC5: priceCents', () => {
  it.each([0, 1234, 10_000_000, null])('allows %s', async (priceCents) => {
    await assertSucceeds(updateDoc(item(alice()), { priceCents }))
  })

  it.each([12.5, -1, 10_000_001, '10'])('denies %s', async (priceCents) => {
    await assertFails(updateDoc(item(alice()), { priceCents }))
  })
})

describe('S-015 AC6: access control, delete and cross-family', () => {
  it('lets a member delete an item', async () => {
    await assertSucceeds(deleteDoc(item(alice())))
  })

  it('lets a member get and list items', async () => {
    await assertSucceeds(getDoc(item(alice())))
    await assertSucceeds(getDocs(collection(alice(), 'families/F1/items')))
  })

  const actors: Array<[string, () => ReturnType<typeof alice>]> = [
    ['non-member', () => asUser(env, 'carol')],
    ['anonymous', () => anon(env)],
    ['member of another family', () => asUser(env, 'bob')],
  ]
  describe.each(actors)('%s', (_n, db) => {
    it('is denied get and list', async () => {
      await assertFails(getDoc(item(db())))
      await assertFails(getDocs(collection(db(), 'families/F1/items')))
    })
    it('is denied create, update and delete', async () => {
      await assertFails(setDoc(item(db(), 'n1'), newItem({ createdBy: 'bob' })))
      await assertFails(setDoc(item(db(), 'n2'), newItem({ createdBy: 'carol' })))
      await assertFails(updateDoc(item(db()), { quantity: 2 }))
      await assertFails(deleteDoc(item(db())))
    })
  })

  it('denies a member writing to another family', async () => {
    const f2 = doc(alice(), 'families/F2/items/y')
    await assertFails(updateDoc(f2, { quantity: 2 }))
    await assertFails(deleteDoc(f2))
    await assertFails(setDoc(doc(alice(), 'families/F2/items/n'), newItem()))
  })
})

describe('S-015 AC7: unknown subcollections', () => {
  it('denies read and write on families/F1/foo', async () => {
    const ref = doc(alice(), 'families/F1/foo/x')
    await assertFails(getDoc(ref))
    await assertFails(getDocs(collection(alice(), 'families/F1/foo')))
    await assertFails(setDoc(ref, { a: 1 }))
    await assertFails(deleteDoc(ref))
  })
})
