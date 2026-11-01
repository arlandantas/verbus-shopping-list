import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { alice as aliceOf, itemRef, seedItems, setupItemsEnv } from './itemsSupport'
import { entry } from './catalogSupport'
import { asUser, seed } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupItemsEnv('demo-verbus-items-rename')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await seedItems(env)
})

const alice = () => aliceOf(env)
const renamed = { name: 'Leite integral', nameKey: 'leite integral' }

describe('S-056 AC1: renaming an item', () => {
  it('allows a member to update name and a valid nameKey', async () => {
    await assertSucceeds(updateDoc(itemRef(alice()), renamed))
  })

  it('denies a nameKey outside the regex', async () => {
    await assertFails(updateDoc(itemRef(alice()), { name: 'Leite', nameKey: 'Leite  X' }))
  })

  it('denies renaming while changing createdBy', async () => {
    await assertFails(updateDoc(itemRef(alice()), { ...renamed, createdBy: 'dave' }))
  })

  it('denies a non-member', async () => {
    await assertFails(updateDoc(itemRef(asUser(env, 'bob')), renamed))
  })
})

describe('S-056 AC2: rename batch with catalog', () => {
  it('allows new catalog entry plus recurring:false on the old one', async () => {
    await seed(env, { 'families/F1/catalog/leite': { ...entry(), lastUsedAt: new Date() } })
    const db = alice()
    await assertSucceeds(
      (async () => {
        const batch = writeBatch(db)
        batch.update(itemRef(db), renamed)
        batch.set(
          doc(db, 'families/F1/catalog/leite integral'),
          entry({ name: 'Leite integral', nameKey: 'leite integral', recurring: true }),
          { merge: true },
        )
        batch.set(
          doc(db, 'families/F1/catalog/leite'),
          { recurring: false, lastUsedAt: serverTimestamp() },
          { merge: true },
        )
        await batch.commit()
      })(),
    )
  })
})
