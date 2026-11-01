import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { newItem, seedItem } from './itemsSupport'
import { asUser, newCycle, newPurchase, newPurchaseLine, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-money-adversarial')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  const past = new Date()
  await seed(env, {
    'families/F1': {
      name: 'Casa',
      members: ['alice', 'dave'],
      ownerId: 'alice',
      createdAt: past,
    },
    'families/F1/items/bought': seedItem({
      status: 'bought',
      markedBy: 'alice',
      markedAt: past,
    }),
    'families/F1/purchases/P1': {
      cycle: '2026-10',
      market: 'Mercado Bom',
      itemCount: 1,
      totalCents: 1290,
      createdBy: 'alice',
      purchasedAt: past,
    },
    'families/F1/purchaseLines/L1': {
      ...(await newPurchaseLine()),
      purchasedAt: past,
    },
    'families/F1/cycles/2026-10': { openedBy: 'alice', openedAt: past, recurringAdded: 0 },
  })
})

const alice = () => asUser(env, 'alice')
const ref = (path: string) => doc(alice(), `families/F1/${path}`)

// Same payload shape for control and attack: only the money value differs.
const BAD = [-1, 5.5, '100', Number.NaN, Infinity]

describe('S-079 AC1: money fields reject bad numbers', () => {
  it('items.priceCents: control allows int, attacks denied', async () => {
    await assertSucceeds(updateDoc(ref('items/bought'), { priceCents: 1290 }))
    for (const v of [...BAD, 10_000_001]) {
      await assertFails(updateDoc(ref('items/bought'), { priceCents: v }))
    }
  })
  it('items create: priceCents must be null', async () => {
    await assertSucceeds(setDoc(ref('items/n1'), newItem({ priceCents: null })))
    await assertFails(setDoc(ref('items/n2'), newItem({ priceCents: 5.5 })))
  })
  it('purchases.totalCents on create', async () => {
    await assertSucceeds(
      setDoc(ref('purchases/P2'), await newPurchase({ totalCents: 2_000_000_000 })),
    )
    for (const v of [...BAD, 2_000_000_001]) {
      await assertFails(setDoc(ref('purchases/P3'), await newPurchase({ totalCents: v })))
    }
  })
  it('purchases.totalCents on update', async () => {
    await assertSucceeds(updateDoc(ref('purchases/P1'), { totalCents: 500 }))
    for (const v of [...BAD, 2_000_000_001]) {
      await assertFails(updateDoc(ref('purchases/P1'), { totalCents: v }))
    }
  })
  it('purchaseLines.priceCents on create', async () => {
    await assertSucceeds(
      setDoc(ref('purchaseLines/L2'), await newPurchaseLine({ priceCents: 10_000_000 })),
    )
    for (const v of [...BAD, 10_000_001]) {
      await assertFails(setDoc(ref('purchaseLines/L3'), await newPurchaseLine({ priceCents: v })))
    }
  })
  it('purchaseLines.priceCents on update', async () => {
    await assertSucceeds(updateDoc(ref('purchaseLines/L1'), { priceCents: 100 }))
    for (const v of [...BAD, 10_000_001]) {
      await assertFails(updateDoc(ref('purchaseLines/L1'), { priceCents: v }))
    }
  })
})

describe('S-079 AC2: purchases history is immutable', () => {
  it('control: totalCents update allowed', async () => {
    await assertSucceeds(updateDoc(ref('purchases/P1'), { totalCents: 1 }))
  })
  it.each([
    ['cycle', '2026-09'],
    ['market', 'Outro'],
    ['itemCount', 2],
    ['createdBy', 'dave'],
    ['purchasedAt', serverTimestamp()],
  ])('denies changing %s', async (k, v) => {
    await assertFails(updateDoc(ref('purchases/P1'), { [k]: v }))
    await assertFails(updateDoc(ref('purchases/P1'), { totalCents: 1, [k]: v }))
  })
  it('denies delete', async () => {
    await assertFails(deleteDoc(ref('purchases/P1')))
  })
  it('create: own createdBy allowed, foreign denied', async () => {
    await assertSucceeds(setDoc(ref('purchases/P2'), await newPurchase()))
    await assertFails(setDoc(ref('purchases/P3'), await newPurchase({ createdBy: 'dave' })))
  })
})

describe('S-079 AC3: purchaseLines history is immutable', () => {
  it('control: quantity/unit/priceCents update allowed', async () => {
    await assertSucceeds(
      updateDoc(ref('purchaseLines/L1'), { quantity: 2, unit: 'kg', priceCents: 5 }),
    )
  })
  it.each([
    ['purchaseId', 'P9'],
    ['cycle', '2026-09'],
    ['name', 'Pao'],
    ['nameKey', 'pao'],
    ['categoryId', 'c1'],
    ['categoryName', 'Cat'],
    ['market', 'Outro'],
    ['markedBy', 'dave'],
    ['purchasedAt', serverTimestamp()],
  ])('denies changing %s', async (k, v) => {
    await assertFails(updateDoc(ref('purchaseLines/L1'), { [k]: v }))
    await assertFails(updateDoc(ref('purchaseLines/L1'), { quantity: 2, [k]: v }))
  })
  it('denies delete', async () => {
    await assertFails(deleteDoc(ref('purchaseLines/L1')))
  })
})

describe('S-079 AC4: cycles', () => {
  it('create: valid id and 400 allowed; bad id and 401 denied', async () => {
    await assertSucceeds(setDoc(ref('cycles/2026-11'), await newCycle({ recurringAdded: 400 })))
    await assertFails(setDoc(ref('cycles/2026-12'), await newCycle({ recurringAdded: 401 })))
    await assertFails(setDoc(ref('cycles/2026-12'), await newCycle({ recurringAdded: 1.5 })))
    for (const id of ['2026-13', '2026-00', '26-11', '2026-1', 'abc', '2026-11x']) {
      await assertFails(setDoc(ref(`cycles/${id}`), await newCycle()))
    }
  })
  it('denies update and delete of an existing marker', async () => {
    await assertFails(updateDoc(ref('cycles/2026-10'), { recurringAdded: 1 }))
    await assertFails(deleteDoc(ref('cycles/2026-10')))
  })
})

describe('S-079 AC5: accepted risks (ADR-0016, documented current behavior)', () => {
  it('accepted risk ADR-0016 #1: a member can pre-create a future cycle marker', async () => {
    await assertSucceeds(setDoc(ref('cycles/2099-12'), await newCycle()))
  })
  it('accepted risk ADR-0016 #2: line is not cross-checked against its purchase', async () => {
    await assertSucceeds(
      setDoc(
        ref('purchaseLines/L9'),
        await newPurchaseLine({ purchaseId: 'nope', market: 'Outro', priceCents: 9_999_999 }),
      ),
    )
  })
  it('accepted risk ADR-0016 #3: a line can be pre-created with an item id', async () => {
    await assertSucceeds(setDoc(ref('purchaseLines/bought'), await newPurchaseLine()))
  })
})
