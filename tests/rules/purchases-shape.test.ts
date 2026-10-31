import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
import { asUser, newPurchase, newPurchaseLine, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-purchases-shape')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': { name: 'Casa', members: ['alice'], ownerId: 'alice', createdAt: new Date() },
  })
})

const putP = async (over: Record<string, unknown>) =>
  setDoc(doc(asUser(env, 'alice'), 'families/F1/purchases/P1'), await newPurchase(over))
const putL = async (over: Record<string, unknown>) =>
  setDoc(doc(asUser(env, 'alice'), 'families/F1/purchaseLines/L1'), await newPurchaseLine(over))

describe('S-033 AC4: purchases shape', () => {
  it('allows a valid purchase and null market/total', async () => {
    await assertSucceeds(putP({}))
  })
  it('allows null market and totalCents', async () => {
    await assertSucceeds(putP({ market: null, totalCents: null }))
  })
  it.each([
    ['cycle 2026-13', { cycle: '2026-13' }],
    ['cycle 26-11', { cycle: '26-11' }],
    ['empty market', { market: '' }],
    ['long market', { market: 'x'.repeat(61) }],
    ['itemCount 0', { itemCount: 0 }],
    ['itemCount 201', { itemCount: 201 }],
    ['negative total', { totalCents: -1 }],
    ['foreign createdBy', { createdBy: 'bob' }],
    ['client purchasedAt', { purchasedAt: new Date() }],
    ['extra key', { extra: 1 }],
  ])('denies %s', async (_n, over) => {
    await assertFails(putP(over))
  })
  it('allows boundary values', async () => {
    await assertSucceeds(
      putP({ itemCount: 200, totalCents: 2_000_000_000, market: 'x'.repeat(60) }),
    )
  })
})

describe('S-033 AC5: purchaseLines shape', () => {
  it('allows a valid line', async () => {
    await assertSucceeds(putL({}))
  })
  it('allows null optional fields and boundaries', async () => {
    await assertSucceeds(
      putL({
        market: null,
        markedBy: null,
        priceCents: null,
        categoryId: 'c',
        categoryName: 'x'.repeat(40),
      }),
    )
  })
  it.each([
    ['unit', { unit: 'lt' }],
    ['categoryName 41', { categoryName: 'x'.repeat(41) }],
    ['categoryName empty', { categoryName: '' }],
    ['priceCents negative', { priceCents: -1 }],
    ['priceCents float', { priceCents: 1.5 }],
    ['priceCents string', { priceCents: '10' }],
    ['purchasedAt client', { purchasedAt: new Date() }],
    ['extra key', { extra: 1 }],
    ['bad cycle', { cycle: '2026-00' }],
    ['bad nameKey', { nameKey: 'Leite!' }],
    ['quantity 0', { quantity: 0 }],
    ['purchaseId number', { purchaseId: 1 }],
  ])('denies %s', async (_n, over) => {
    await assertFails(putL(over))
  })
  it('denies a missing key', async () => {
    const rest: Record<string, unknown> = await newPurchaseLine()
    delete rest.purchaseId
    await assertFails(setDoc(doc(asUser(env, 'alice'), 'families/F1/purchaseLines/L1'), rest))
  })
})
