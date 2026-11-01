import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { alice as aliceOf, itemRef, newItem, seedItems, setupItemsEnv } from './itemsSupport'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupItemsEnv('demo-verbus-items-price')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await seedItems(env)
})

const alice = () => aliceOf(env)

describe('S-032 AC1: price on a bought item', () => {
  it.each([0, 1290, 10_000_000])('allows priceCents %s', async (priceCents) => {
    await assertSucceeds(updateDoc(itemRef(alice(), 'bought'), { priceCents }))
  })

  it('allows clearing the price back to null', async () => {
    await assertSucceeds(updateDoc(itemRef(alice(), 'pricedBought'), { priceCents: null }))
  })

  it.each([10_000_001, 12.5, -1, '1290'])('denies priceCents %s', async (priceCents) => {
    await assertFails(updateDoc(itemRef(alice(), 'bought'), { priceCents }))
  })
})

describe('S-032 AC2 (ADR-0022): price on a pending item', () => {
  it.each([0, 1290, 10_000_000])('allows update of priceCents %s', async (priceCents) => {
    await assertSucceeds(updateDoc(itemRef(alice()), { priceCents }))
  })

  it.each([10_000_001, 12.5, -1, '1290'])('denies out-of-range priceCents %s', async (v) => {
    await assertFails(updateDoc(itemRef(alice()), { priceCents: v }))
  })

  it('denies creating a pending item with a price', async () => {
    await assertFails(setDoc(itemRef(alice(), 'n1'), newItem({ priceCents: 100 })))
  })

  it('still allows null price on a pending item', async () => {
    await assertSucceeds(updateDoc(itemRef(alice()), { priceCents: null }))
  })
})

describe('S-032 AC3 (ADR-0022): unmarking keeps the price', () => {
  const revert = { status: 'pending', markedBy: null, markedAt: null }

  it('allows reverting to pending while keeping the price', async () => {
    await assertSucceeds(updateDoc(itemRef(alice(), 'pricedBought'), revert))
  })

  it('allows marking bought and pricing in one update', async () => {
    await assertSucceeds(
      updateDoc(itemRef(alice()), {
        status: 'bought',
        markedBy: 'alice',
        markedAt: serverTimestamp(),
        priceCents: 500,
      }),
    )
  })

  it('denies marking bought with another uid as markedBy', async () => {
    await assertFails(
      updateDoc(itemRef(alice()), {
        status: 'bought',
        markedBy: 'dave',
        markedAt: serverTimestamp(),
      }),
    )
  })
})
