import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { anon, asUser } from './support'
import { alice as aliceOf, itemRef, newItem, seedItems, setupItemsEnv } from './itemsSupport'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupItemsEnv('demo-verbus-items-access')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await seedItems(env)
})

const alice = () => aliceOf(env)
const item = itemRef

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
