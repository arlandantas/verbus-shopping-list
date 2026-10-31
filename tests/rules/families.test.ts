import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { anon, asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-families')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': { name: 'Casa', members: ['alice'], ownerId: 'alice', createdAt: new Date() },
    'families/F1/items/x': { name: 'leite' },
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    'families/F2/items/y': { name: 'pao' },
    'users/alice': { displayName: 'A', email: 'a@x.com', familyId: 'F1', createdAt: new Date() },
    'users/carol': { displayName: 'C', email: 'c@x.com', familyId: null, createdAt: new Date() },
  })
})

const fam = (over: Record<string, unknown> = {}) => ({
  name: 'Nova',
  members: ['carol'],
  ownerId: 'carol',
  inviteCode: 'ABCD2345',
  createdAt: serverTimestamp(),
  ...over,
})

/** Creates family `id` plus its invite in one batch, as the client does (ADR-0003). */
function createFamily(
  uid: string,
  id: string,
  data: Record<string, unknown>,
  code = 'ABCD2345',
  familyName: unknown = data.name,
  profile: boolean = true,
) {
  const db = asUser(env, uid)
  const b = writeBatch(db)
  b.set(doc(db, `families/${id}`), data)
  b.set(doc(db, `invites/${code}`), {
    familyId: id,
    familyName,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  if (profile) b.update(doc(db, `users/${uid}`), { familyId: id })
  return b.commit()
}

describe('S-007 AC3: creating families', () => {
  it('allows a valid create with the creator as sole member', async () => {
    await assertSucceeds(createFamily('carol', 'F3', fam({ inviteCode: 'WXYZ6789' }), 'WXYZ6789'))
  })

  it('S-008: requires an inviteCode matching an invite created in the same batch', async () => {
    const db = asUser(env, 'carol')
    const noCode: Record<string, unknown> = fam()
    delete noCode.inviteCode
    await assertFails(createFamily('carol', 'F3', noCode))
    await assertFails(setDoc(doc(db, 'families/F3'), fam())) // invite missing
    await assertFails(createFamily('carol', 'F3', fam({ inviteCode: 'short' })))
    await assertFails(createFamily('carol', 'F3', fam({ inviteCode: 'ABCD0345' }), 'ABCD0345'))
    // invite pointing at another family
    const b = writeBatch(db)
    b.set(doc(db, 'families/F3'), fam())
    b.set(doc(db, 'invites/ABCD2345'), {
      familyId: 'F1',
      familyName: 'Nova',
      createdBy: 'carol',
      createdAt: serverTimestamp(),
    })
    await assertFails(b.commit())
  })

  it('ADR-0007: denies an invite whose familyName mismatches or is missing', async () => {
    await assertFails(createFamily('carol', 'F3', fam(), 'ABCD2345', 'Outro nome'))
    await assertFails(createFamily('carol', 'F3', fam(), 'ABCD2345', null))
    await assertFails(createFamily('carol', 'F3', fam(), 'ABCD2345', ''))
  })

  it('denies members with another uid or extra uids', async () => {
    await assertFails(createFamily('carol', 'F3', fam({ members: ['dave'] })))
    await assertFails(createFamily('carol', 'F3', fam({ members: ['carol', 'dave'] })))
  })

  it('denies a foreign ownerId, bad name, extra key and anonymous create', async () => {
    await assertFails(createFamily('carol', 'F3', fam({ ownerId: 'dave' })))
    await assertFails(createFamily('carol', 'F3', fam({ name: '' })))
    await assertFails(createFamily('carol', 'F3', fam({ name: 'x'.repeat(61) })))
    await assertFails(createFamily('carol', 'F3', fam({ name: 5 })))
    await assertFails(createFamily('carol', 'F3', fam({ extra: 1 })))
    await assertFails(setDoc(doc(anon(env), 'families/F3'), fam()))
  })

  it('accepts a 60-char name', async () => {
    await assertSucceeds(createFamily('carol', 'F3', fam({ name: 'x'.repeat(60) })))
  })
})

describe('S-014 AC2: creating a family updates the profile in the same batch', () => {
  it('denies creating without updating the profile', async () => {
    await assertFails(createFamily('carol', 'F3', fam(), 'ABCD2345', 'Nova', false))
  })

  it('denies a profile pointing at a different family than the one created', async () => {
    const db = asUser(env, 'carol')
    const b = writeBatch(db)
    b.set(doc(db, 'families/F3'), fam())
    b.set(doc(db, 'invites/ABCD2345'), {
      familyId: 'F3',
      familyName: 'Nova',
      createdBy: 'carol',
      createdAt: serverTimestamp(),
    })
    b.update(doc(db, 'users/carol'), { familyId: 'F1' })
    await assertFails(b.commit())
  })

  it('denies a user who already has a family creating another', async () => {
    const data = fam({ members: ['alice'], ownerId: 'alice' })
    await assertFails(createFamily('alice', 'F3', data))
  })

  it('denies creating when the user profile does not exist', async () => {
    await assertFails(createFamily('erin', 'F3', fam({ members: ['erin'], ownerId: 'erin' })))
  })
})

describe('S-007 AC4: reading families and items', () => {
  it('lets a member read the family and its items', async () => {
    const db = asUser(env, 'alice')
    await assertSucceeds(getDoc(doc(db, 'families/F1')))
    await assertSucceeds(getDoc(doc(db, 'families/F1/items/x')))
  })

  it('denies non-members and anonymous users', async () => {
    const db = asUser(env, 'carol')
    await assertFails(getDoc(doc(db, 'families/F1')))
    await assertFails(getDoc(doc(db, 'families/F1/items/x')))
    await assertFails(getDoc(doc(anon(env), 'families/F1')))
    await assertFails(getDoc(doc(anon(env), 'families/F1/items/x')))
  })

  it('denies cross-family reads', async () => {
    const alice = asUser(env, 'alice')
    const bob = asUser(env, 'bob')
    await assertFails(getDoc(doc(alice, 'families/F2')))
    await assertFails(getDoc(doc(alice, 'families/F2/items/y')))
    await assertFails(getDoc(doc(bob, 'families/F1')))
    await assertFails(getDoc(doc(bob, 'families/F1/items/x')))
  })
})

describe('S-007 AC6: deletes and unknown paths', () => {
  it('denies deleting a family, even for members', async () => {
    await assertFails(deleteDoc(doc(asUser(env, 'alice'), 'families/F1')))
    await assertFails(deleteDoc(doc(asUser(env, 'carol'), 'families/F1')))
  })

  it('denies updating a family and writing items (out of scope)', async () => {
    const db = asUser(env, 'alice')
    await assertFails(updateDoc(doc(db, 'families/F1'), { name: 'x' }))
    await assertFails(setDoc(doc(db, 'families/F1/items/z'), { name: 'z' }))
  })

  it('denies paths outside the model', async () => {
    const db = asUser(env, 'alice')
    await assertFails(getDoc(doc(db, 'other/x')))
    await assertFails(setDoc(doc(db, 'other/x'), { a: 1 }))
  })
})
