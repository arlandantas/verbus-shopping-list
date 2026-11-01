import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { seedItem } from './itemsSupport'
import { anon, asUser, newPurchase, newPurchaseLine, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-purchases')
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
    'families/F1/purchases/P0': { ...(await newPurchase()), purchasedAt: new Date() },
    'families/F1/purchaseLines/L0': { ...(await newPurchaseLine()), purchasedAt: new Date() },
  })
})

const alice = () => asUser(env, 'alice')

describe('S-033 AC1: checkout batch', () => {
  it('allows 1 purchase + 200 lines + 200 item deletes (401 writes)', async () => {
    const ids = Array.from({ length: 200 }, (_, i) => `i${i}`)
    await env.withSecurityRulesDisabled(async (ctx) => {
      const admin = ctx.firestore()
      const seedBatch = writeBatch(admin)
      for (const id of ids) seedBatch.set(doc(admin, `families/F1/items/${id}`), seedItem())
      await seedBatch.commit()
    })
    const db = alice()
    const batch = writeBatch(db)
    batch.set(doc(db, 'families/F1/purchases/P1'), await newPurchase({ itemCount: 200 }))
    for (const id of ids) {
      batch.set(doc(db, `families/F1/purchaseLines/${id}`), await newPurchaseLine())
      batch.delete(doc(db, `families/F1/items/${id}`))
    }
    await assertSucceeds(batch.commit())
  }, 30_000)
})

describe('S-033 AC2: repeated checkout', () => {
  it('denies the whole batch when a line id already exists', async () => {
    const db = alice()
    const batch = writeBatch(db)
    batch.set(doc(db, 'families/F1/purchases/P2'), await newPurchase())
    batch.set(doc(db, 'families/F1/purchaseLines/L0'), await newPurchaseLine())
    await assertFails(batch.commit())
    await env.withSecurityRulesDisabled(async (ctx) => {
      const snap = await getDoc(doc(ctx.firestore(), 'families/F1/purchases/P2'))
      expect(snap.exists()).toBe(false)
    })
  })
})

describe('S-033 AC3: read-only history and isolation', () => {
  it('allows a member to read purchase and line', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'families/F1/purchases/P0')))
    await assertSucceeds(getDoc(doc(alice(), 'families/F1/purchaseLines/L0')))
  })

  it.each(['purchases/P0', 'purchaseLines/L0'])(
    'denies update of cycle in %s (S-067 AC7)',
    async (path) => {
      await assertFails(updateDoc(doc(alice(), `families/F1/${path}`), { cycle: '2026-09' }))
    },
  )

  it.each(['purchases/P0', 'purchaseLines/L0'])('denies delete of %s', async (path) => {
    await assertFails(deleteDoc(doc(alice(), `families/F1/${path}`)))
  })

  it.each(['purchases/P0', 'purchaseLines/L0'])('denies other family read of %s', async (path) => {
    await assertFails(getDoc(doc(asUser(env, 'bob'), `families/F1/${path}`)))
  })

  it('denies other family and anonymous creates', async () => {
    await assertFails(
      setDoc(
        doc(asUser(env, 'bob'), 'families/F1/purchases/P3'),
        await newPurchase({ createdBy: 'bob' }),
      ),
    )
    await assertFails(
      setDoc(doc(asUser(env, 'bob'), 'families/F1/purchaseLines/L3'), await newPurchaseLine()),
    )
    await assertFails(setDoc(doc(anon(env), 'families/F1/purchases/P3'), await newPurchase()))
    await assertFails(getDoc(doc(anon(env), 'families/F1/purchases/P0')))
  })
})
