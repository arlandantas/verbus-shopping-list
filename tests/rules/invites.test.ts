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
  writeBatch,
} from 'firebase/firestore'
import { anon, asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-invites')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': { name: 'Casa', members: ['alice'], ownerId: 'alice', createdAt: new Date() },
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    'invites/ABCD2345': {
      familyId: 'F1',
      familyName: 'Casa',
      createdBy: 'alice',
      createdAt: new Date(),
    },
  })
})

const invite = (over: Record<string, unknown> = {}) => ({
  familyId: 'F1',
  familyName: 'Casa',
  createdBy: 'alice',
  createdAt: serverTimestamp(),
  ...over,
})

describe('S-008 AC1: reading invites', () => {
  it('lets any signed-in user get an invite', async () => {
    await assertSucceeds(getDoc(doc(asUser(env, 'carol'), 'invites/ABCD2345')))
    await assertSucceeds(getDoc(doc(asUser(env, 'alice'), 'invites/ABCD2345')))
  })

  it('denies list, even for members', async () => {
    await assertFails(getDocs(collection(asUser(env, 'carol'), 'invites')))
    await assertFails(getDocs(collection(asUser(env, 'alice'), 'invites')))
  })

  it('denies anonymous get', async () => {
    await assertFails(getDoc(doc(anon(env), 'invites/ABCD2345')))
  })
})

describe('S-008 AC2: creating invites', () => {
  it('lets a member create an invite for their family', async () => {
    await assertSucceeds(setDoc(doc(asUser(env, 'alice'), 'invites/WXYZ6789'), invite()))
  })

  it('denies a non-member, including cross-family', async () => {
    await assertFails(setDoc(doc(asUser(env, 'carol'), 'invites/WXYZ6789'), invite()))
    await assertFails(
      setDoc(doc(asUser(env, 'bob'), 'invites/WXYZ6789'), invite({ createdBy: 'bob' })),
    )
    await assertFails(setDoc(doc(anon(env), 'invites/WXYZ6789'), invite()))
  })

  it('denies a spoofed createdBy, extra keys and bad types', async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, 'invites/WXYZ6789'), invite({ createdBy: 'bob' })))
    await assertFails(setDoc(doc(db, 'invites/WXYZ6789'), invite({ extra: 1 })))
    await assertFails(setDoc(doc(db, 'invites/WXYZ6789'), invite({ familyId: 7 })))
    await assertFails(setDoc(doc(db, 'invites/WXYZ6789'), invite({ createdAt: new Date(0) })))
  })

  it('ADR-0007: requires familyName equal to the family name, 1-60 chars', async () => {
    const db = asUser(env, 'alice')
    const missing: Record<string, unknown> = invite()
    delete missing.familyName
    await assertFails(setDoc(doc(db, 'invites/WXYZ6789'), missing))
    await assertFails(setDoc(doc(db, 'invites/WXYZ6789'), invite({ familyName: 'Errada' })))
    await assertFails(setDoc(doc(db, 'invites/WXYZ6789'), invite({ familyName: '' })))
    await assertFails(setDoc(doc(db, 'invites/WXYZ6789'), invite({ familyName: 5 })))
    await assertFails(setDoc(doc(db, 'invites/WXYZ6789'), invite({ familyName: 'x'.repeat(61) })))
  })

  it('denies codes outside the 8-char alphabet', async () => {
    const db = asUser(env, 'alice')
    for (const code of [
      'SHORT23',
      'TOOLONG234',
      'abcd2345',
      'ABCD0345',
      'ABCD1345',
      'ABCDI345',
      'ABCDL345',
      'ABCDO345',
    ]) {
      await assertFails(setDoc(doc(db, `invites/${code}`), invite()))
    }
  })

  it('denies overwriting or editing an existing invite', async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, 'invites/ABCD2345'), invite()))
    await assertFails(updateDoc(doc(db, 'invites/ABCD2345'), { familyId: 'F2' }))
  })

  it('denies a joiner from repointing an invite to another family', async () => {
    await assertFails(
      setDoc(doc(asUser(env, 'bob'), 'invites/WXYZ6789'), invite({ createdBy: 'bob' })),
    )
  })
})

describe('S-008 AC5: deleting invites (rotation)', () => {
  it('lets a member delete their family invite', async () => {
    await assertSucceeds(deleteDoc(doc(asUser(env, 'alice'), 'invites/ABCD2345')))
  })

  it('denies non-members, other-family members and anonymous', async () => {
    await assertFails(deleteDoc(doc(asUser(env, 'carol'), 'invites/ABCD2345')))
    await assertFails(deleteDoc(doc(asUser(env, 'bob'), 'invites/ABCD2345')))
    await assertFails(deleteDoc(doc(anon(env), 'invites/ABCD2345')))
  })

  it('rotates: delete old + create new in one batch', async () => {
    const db = asUser(env, 'alice')
    const b = writeBatch(db)
    b.delete(doc(db, 'invites/ABCD2345'))
    b.set(doc(db, 'invites/WXYZ6789'), invite())
    await assertSucceeds(b.commit())
  })
})
