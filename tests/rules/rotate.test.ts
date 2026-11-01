import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { arrayUnion, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-rotate')
})
afterAll(async () => {
  await env.cleanup()
})

const now = () => new Date()
const inv = (familyId: string, createdBy: string, familyName = 'Casa') => ({
  familyId,
  familyName,
  createdBy,
  createdAt: now(),
})

beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': {
      name: 'Casa',
      members: ['alice'],
      ownerId: 'alice',
      inviteCode: 'ABCD2345',
      createdAt: now(),
    },
    'families/F2': {
      name: 'Outra',
      members: ['bob'],
      ownerId: 'bob',
      inviteCode: 'BBBB2345',
      createdAt: now(),
    },
    'invites/ABCD2345': inv('F1', 'alice'),
    'invites/BBBB2345': inv('F2', 'bob', 'Outra'),
    'users/alice': { displayName: 'A', email: 'a@x.com', familyId: 'F1', createdAt: now() },
    'users/bob': { displayName: 'B', email: 'b@x.com', familyId: 'F2', createdAt: now() },
    'users/carol': { displayName: 'C', email: 'c@x.com', familyId: null, createdAt: now() },
  })
})

interface Opts {
  extra?: Record<string, unknown>
  inviteFamily?: string
  createInvite?: boolean
  deleteOld?: boolean
}

function rotate(uid: string, familyId: string, code: unknown, o: Opts = {}) {
  const db = asUser(env, uid)
  const b = writeBatch(db)
  if (o.createInvite !== false && typeof code === 'string') {
    const name = o.inviteFamily === 'F2' ? 'Outra' : 'Casa'
    b.set(doc(db, `invites/${code}`), {
      familyId: o.inviteFamily ?? familyId,
      familyName: name,
      createdBy: uid,
      createdAt: serverTimestamp(),
    })
  }
  b.update(doc(db, `families/${familyId}`), { inviteCode: code, ...o.extra })
  if (o.deleteOld !== false) b.delete(doc(db, 'invites/ABCD2345'))
  return b.commit()
}

describe('S-077 AC1: member rotates the code', () => {
  it('allows a member to change only inviteCode with a fresh invite in the batch', async () => {
    await assertSucceeds(rotate('alice', 'F1', 'NEWC2345'))
  })
  it('allows a second rotation (control)', async () => {
    await assertSucceeds(rotate('alice', 'F1', 'NEWC2345'))
    const db = asUser(env, 'alice')
    const b = writeBatch(db)
    b.set(doc(db, 'invites/NEWD2345'), { ...inv('F1', 'alice'), createdAt: serverTimestamp() })
    b.update(doc(db, 'families/F1'), { inviteCode: 'NEWD2345' })
    b.delete(doc(db, 'invites/NEWC2345'))
    await assertSucceeds(b.commit())
  })
})

describe('S-077 AC2: denied rotations', () => {
  it('denies extra fields, allows the plain rotation (control)', async () => {
    await assertFails(rotate('alice', 'F1', 'NEWC2345', { extra: { name: 'Hack' } }))
    await assertFails(rotate('alice', 'F1', 'NEWC2345', { extra: { ownerId: 'alice2' } }))
    await assertFails(rotate('alice', 'F1', 'NEWC2345', { extra: { members: ['alice', 'x'] } }))
    await assertSucceeds(rotate('alice', 'F1', 'NEWC2345'))
  })
  it('denies an invite for another family, allows own (control)', async () => {
    await assertFails(rotate('alice', 'F1', 'NEWC2345', { inviteFamily: 'F2' }))
    await assertSucceeds(rotate('alice', 'F1', 'NEWC2345'))
  })
  it('denies rotating without creating the invite, allows with it (control)', async () => {
    await assertFails(rotate('alice', 'F1', 'NEWC2345', { createInvite: false }))
    await assertSucceeds(rotate('alice', 'F1', 'NEWC2345'))
  })
  it('denies setting inviteCode to an existing foreign invite, allows a fresh one (control)', async () => {
    await assertFails(rotate('alice', 'F1', 'BBBB2345', { createInvite: false }))
    await assertSucceeds(rotate('alice', 'F1', 'NEWC2345'))
  })
  it('denies malformed codes, allows a valid one (control)', async () => {
    await assertFails(rotate('alice', 'F1', 'abc'))
    await assertFails(rotate('alice', 'F1', 'NEWC0145'))
    await assertSucceeds(rotate('alice', 'F1', 'NEWC2345'))
  })
  it('denies non-members and outsiders without a family, allows the member (control)', async () => {
    await assertFails(rotate('bob', 'F1', 'NEWC2345', { deleteOld: false }))
    await assertFails(rotate('carol', 'F1', 'NEWC2345', { deleteOld: false }))
    await assertSucceeds(rotate('alice', 'F1', 'NEWC2345'))
  })
  it('denies a non-member smuggling inviteCode in a join, allows a plain join (control)', async () => {
    const db = asUser(env, 'carol')
    const bad = writeBatch(db)
    bad.update(doc(db, 'families/F1'), {
      members: arrayUnion('carol'),
      joinCode: 'ABCD2345',
      inviteCode: 'ABCD9999',
    })
    bad.update(doc(db, 'users/carol'), { familyId: 'F1' })
    await assertFails(bad.commit())
    const ok = writeBatch(db)
    ok.update(doc(db, 'families/F1'), { members: arrayUnion('carol'), joinCode: 'ABCD2345' })
    ok.update(doc(db, 'users/carol'), { familyId: 'F1' })
    await assertSucceeds(ok.commit())
  })
})

describe('S-077 AC3: old code stops working', () => {
  function join(code: string) {
    const db = asUser(env, 'carol')
    const b = writeBatch(db)
    b.update(doc(db, 'families/F1'), { members: arrayUnion('carol'), joinCode: code })
    b.update(doc(db, 'users/carol'), { familyId: 'F1' })
    return b.commit()
  }
  it('denies join with the old code after rotation, allows the new one', async () => {
    await assertSucceeds(rotate('alice', 'F1', 'NEWC2345'))
    await assertFails(join('ABCD2345'))
    await assertSucceeds(join('NEWC2345'))
  })
})
