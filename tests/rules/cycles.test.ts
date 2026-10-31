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
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { newItem } from './itemsSupport'
import { anon, asUser, newCycle, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-cycles')
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
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    'families/F1/cycles/2026-10': {
      openedBy: 'alice',
      openedAt: new Date(),
      recurringAdded: 0,
    },
  })
})

const alice = () => asUser(env, 'alice')
const cyclePath = (id: string) => `families/F1/cycles/${id}`

async function openBatch(db: ReturnType<typeof alice>, suffix = '') {
  const batch = writeBatch(db)
  batch.set(doc(db, cyclePath('2026-11')), await newCycle())
  for (const n of ['a', 'b', 'c']) {
    batch.set(doc(db, `families/F1/items/${n}${suffix}`), newItem({ recurring: true }))
  }
  return batch
}

describe('S-034 AC1: open the month', () => {
  it('allows marker + 3 pending recurring items in one batch', async () => {
    const db = alice()
    await assertSucceeds((await openBatch(db)).commit())
    const items = await getDocs(collection(db, 'families/F1/items'))
    expect(items.size).toBe(3)
  })

  it('allows a member to read the marker; denies non-members and anon', async () => {
    await assertSucceeds(getDoc(doc(asUser(env, 'dave'), cyclePath('2026-10'))))
    await assertFails(getDoc(doc(asUser(env, 'bob'), cyclePath('2026-10'))))
    await assertFails(getDoc(doc(anon(env), cyclePath('2026-10'))))
  })
})

describe('S-034 AC2: second device', () => {
  it('denies the whole second batch and creates no extra items', async () => {
    const db = alice()
    await assertSucceeds((await openBatch(db)).commit())
    const dave = asUser(env, 'dave')
    const batch = writeBatch(dave)
    batch.set(doc(dave, cyclePath('2026-11')), await newCycle({ openedBy: 'dave' }))
    for (const n of ['x', 'y', 'z']) {
      batch.set(
        doc(dave, `families/F1/items/${n}`),
        newItem({ createdBy: 'dave', recurring: true }),
      )
    }
    await assertFails(batch.commit())
    const items = await getDocs(collection(db, 'families/F1/items'))
    expect(items.size).toBe(3)
  })
})

describe('S-034 AC3: marker shape and access', () => {
  const create = async (id: string, data: Record<string, unknown>, uid = 'alice') =>
    setDoc(doc(asUser(env, uid), cyclePath(id)), data)

  it.each(['2026-13', 'nov', '2026-00', '26-11', '2026-1'])('denies id %s', async (id) => {
    await assertFails(create(id, await newCycle()))
  })

  it('denies openedBy of someone else', async () => {
    await assertFails(create('2026-11', await newCycle({ openedBy: 'dave' })))
  })

  it.each([401, -1, 1.5, '3', null])('denies recurringAdded %s', async (v) => {
    await assertFails(create('2026-11', await newCycle({ recurringAdded: v })))
  })

  it.each([0, 400])('allows recurringAdded %s', async (v) => {
    await assertSucceeds(create('2026-11', await newCycle({ recurringAdded: v })))
  })

  it('denies openedAt that is not the server time', async () => {
    await assertFails(create('2026-11', await newCycle({ openedAt: new Date(2020, 1, 1) })))
  })

  it('denies an extra key and a missing key', async () => {
    await assertFails(create('2026-11', await newCycle({ extra: 1 })))
    const missing: Record<string, unknown> = await newCycle()
    delete missing.recurringAdded
    await assertFails(create('2026-11', missing))
  })

  it('denies update and delete of an existing marker', async () => {
    const db = alice()
    await assertFails(updateDoc(doc(db, cyclePath('2026-10')), { recurringAdded: 5 }))
    await assertFails(deleteDoc(doc(db, cyclePath('2026-10'))))
  })

  it('denies create by a non-member and by anon', async () => {
    await assertFails(create('2026-11', await newCycle({ openedBy: 'bob' }), 'bob'))
    await assertFails(setDoc(doc(anon(env), cyclePath('2026-11')), await newCycle()))
  })
})
