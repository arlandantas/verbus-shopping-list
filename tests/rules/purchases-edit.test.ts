import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { asUser, newPurchase, newPurchaseLine, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-purchases-edit')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': {
      name: 'Casa',
      members: ['alice'],
      ownerId: 'alice',
      createdAt: new Date(),
    },
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    'families/F1/purchases/P0': { ...(await newPurchase()), purchasedAt: new Date() },
    'families/F1/purchaseLines/L0': {
      ...(await newPurchaseLine({ priceCents: null })),
      purchasedAt: new Date(),
    },
  })
})

const line = (user = 'alice') => doc(asUser(env, user), 'families/F1/purchaseLines/L0')
const purchase = (user = 'alice') => doc(asUser(env, user), 'families/F1/purchases/P0')

describe('S-067 AC1: member edits quantity, unit and price of a line', () => {
  it('allows priceCents null -> 1290, quantity 1 -> 2 and unit', async () => {
    await assertSucceeds(updateDoc(line(), { priceCents: 1290 }))
    await assertSucceeds(updateDoc(line(), { quantity: 2 }))
    await assertSucceeds(updateDoc(line(), { unit: 'kg', quantity: 1.5, priceCents: null }))
  })
})

describe('S-067 AC2: other line fields stay immutable', () => {
  it.each([
    ['name', 'Outro'],
    ['nameKey', 'outro'],
    ['purchaseId', 'P9'],
    ['cycle', '2026-09'],
    ['market', 'Outro mercado'],
    ['categoryId', 'c1'],
    ['categoryName', 'Frios'],
    ['markedBy', 'dave'],
  ])('denies changing %s', async (key, value) => {
    await assertFails(updateDoc(line(), { [key]: value }))
  })

  it('denies changing purchasedAt', async () => {
    await assertFails(updateDoc(line(), { purchasedAt: serverTimestamp() }))
    await assertFails(updateDoc(line(), { purchasedAt: new Date(2020, 1, 1) }))
  })

  it('denies invalid values and mixing with an immutable key', async () => {
    await assertFails(updateDoc(line(), { quantity: 0 }))
    await assertFails(updateDoc(line(), { quantity: 10000 }))
    await assertFails(updateDoc(line(), { unit: 'xx' }))
    await assertFails(updateDoc(line(), { priceCents: -1 }))
    await assertFails(updateDoc(line(), { priceCents: 1.5 }))
    await assertFails(updateDoc(line(), { priceCents: 10000001 }))
    await assertFails(updateDoc(line(), { priceCents: 100, name: 'Outro' }))
  })

  it('denies delete', async () => {
    await assertFails(deleteDoc(line()))
  })
})

describe('S-067 AC3: purchases accept only totalCents', () => {
  it('allows totalCents int 0..2e9 or null', async () => {
    await assertSucceeds(updateDoc(purchase(), { totalCents: 0 }))
    await assertSucceeds(updateDoc(purchase(), { totalCents: 2000000000 }))
    await assertSucceeds(updateDoc(purchase(), { totalCents: null }))
  })

  it('denies invalid totalCents', async () => {
    await assertFails(updateDoc(purchase(), { totalCents: -1 }))
    await assertFails(updateDoc(purchase(), { totalCents: 2000000001 }))
    await assertFails(updateDoc(purchase(), { totalCents: 1.5 }))
    await assertFails(updateDoc(purchase(), { totalCents: '10' }))
  })

  it.each([
    ['market', 'Outro'],
    ['itemCount', 2],
    ['cycle', '2026-09'],
    ['createdBy', 'dave'],
  ])('denies changing %s', async (key, value) => {
    await assertFails(updateDoc(purchase(), { [key]: value }))
    await assertFails(updateDoc(purchase(), { [key]: value, totalCents: 5 }))
  })

  it('denies changing purchasedAt and delete', async () => {
    await assertFails(updateDoc(purchase(), { purchasedAt: serverTimestamp() }))
    await assertFails(deleteDoc(purchase()))
  })
})

describe('S-067 AC4: only family members', () => {
  it('denies a member of another family and a non-member', async () => {
    for (const uid of ['bob', 'eve']) {
      await assertFails(updateDoc(line(uid), { priceCents: 1 }))
      await assertFails(updateDoc(purchase(uid), { totalCents: 1 }))
    }
  })
})
