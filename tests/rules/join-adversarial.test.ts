import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { anon, asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-join-adv')
})
afterAll(async () => {
  await env.cleanup()
})

const nine = Array.from({ length: 9 }, (_, i) => `m${i}`)
const now = () => new Date()
const inv = (familyId: string, createdBy: string, familyName = 'Casa') => ({
  familyId,
  familyName,
  createdBy,
  createdAt: now(),
})
// Codes that fail validCode, seeded with rules disabled so only the regex can deny the join.
const badCodes = [
  'abcd2345',
  'ABCD234',
  'ABCD23456',
  'ABCD0345',
  'ABCDO345',
  'ABCDI345',
  'ABCDL345',
  'ABCD1345',
]

beforeEach(async () => {
  await env.clearFirestore()
  const bad: Record<string, Record<string, unknown>> = {}
  for (const c of badCodes) bad[`invites/${c}`] = inv('F1', 'alice')
  await seed(env, {
    ...bad,
    'families/F1': { name: 'Casa', members: ['alice'], ownerId: 'alice', createdAt: now() },
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: now() },
    'families/FULL': { name: 'Cheia', members: nine, ownerId: 'm0', createdAt: now() },
    'invites/ABCD2345': inv('F1', 'alice'),
    'invites/BBBB2345': inv('F2', 'bob', 'Outra'),
    'invites/NNNN2345': inv('FULL', 'm0'),
    'users/alice': { displayName: 'A', email: 'a@x.com', familyId: 'F1', createdAt: now() },
    'users/bob': { displayName: 'B', email: 'b@x.com', familyId: 'F2', createdAt: now() },
    'users/carol': { displayName: 'C', email: 'c@x.com', familyId: null, createdAt: now() },
    'users/dave': { displayName: 'D', email: 'd@x.com', familyId: null, createdAt: now() },
  })
})

function join(
  uid: string,
  familyId: string,
  members: string[],
  joinCode: unknown = 'ABCD2345',
  profile = true,
) {
  const db = asUser(env, uid)
  const b = writeBatch(db)
  b.update(doc(db, `families/${familyId}`), { members, joinCode })
  if (profile) b.update(doc(db, `users/${uid}`), { familyId })
  return b.commit()
}

describe('S-076 AC1: code from another family', () => {
  it('denies A with B code, allows A with A code (control)', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'carol'], 'BBBB2345'))
    await assertFails(join('carol', 'F2', ['bob', 'carol'], 'ABCD2345'))
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol'], 'ABCD2345'))
  })
})

describe('S-076 AC2: nonexistent or malformed code', () => {
  it('denies a nonexistent well-formed code, allows the real one (control)', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'carol'], 'ZZZZ2345'))
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol']))
  })

  it.each(badCodes)('denies existing invite with malformed code %s', async (code) => {
    await assertFails(join('carol', 'F1', ['alice', 'carol'], code))
  })

  it('allows a well-formed code for the same invite shape (control)', async () => {
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol'], 'ABCD2345'))
  })
})

describe('S-076 AC3: profile requirements', () => {
  it('denies a member of another family, allows a free user (control)', async () => {
    await assertFails(join('bob', 'F1', ['alice', 'bob']))
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol']))
  })

  it('denies joining without the profile in the batch, allows with it (control)', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'carol'], 'ABCD2345', false))
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol'], 'ABCD2345', true))
  })
})

describe('S-076 AC4: members list tampering', () => {
  it('denies other uid, two uids, reorder, removal; allows self append (control)', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'dave']))
    await assertFails(join('carol', 'F1', ['alice', 'carol', 'dave']))
    await assertFails(join('carol', 'F1', ['carol', 'alice']))
    await assertFails(join('carol', 'F1', ['carol']))
    await assertFails(join('carol', 'F1', []))
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol']))
  })

  it('denies the 11th member, allows the 10th (control)', async () => {
    await assertSucceeds(join('carol', 'FULL', [...nine, 'carol'], 'NNNN2345'))
    await assertFails(join('dave', 'FULL', [...nine, 'carol', 'dave'], 'NNNN2345'))
  })
})

describe('S-076 AC5: creating invites', () => {
  const mk = (over: Record<string, unknown> = {}) => ({
    familyId: 'F1',
    familyName: 'Casa',
    createdBy: 'alice',
    createdAt: serverTimestamp(),
    ...over,
  })

  it('denies non-member, wrong name, foreign createdBy; allows valid (control)', async () => {
    const a = asUser(env, 'alice')
    await assertFails(
      setDoc(doc(asUser(env, 'carol'), 'invites/WXYZ6789'), mk({ createdBy: 'carol' })),
    )
    await assertFails(setDoc(doc(asUser(env, 'bob'), 'invites/WXYZ6789'), mk({ createdBy: 'bob' })))
    await assertFails(setDoc(doc(a, 'invites/WXYZ6789'), mk({ familyName: 'Outra' })))
    await assertFails(setDoc(doc(a, 'invites/WXYZ6789'), mk({ createdBy: 'bob' })))
    await assertSucceeds(setDoc(doc(a, 'invites/WXYZ6789'), mk()))
  })
})

describe('S-076 AC6: family create tied to invite', () => {
  const fam = (code: string) => ({
    name: 'Nova',
    members: ['carol'],
    ownerId: 'carol',
    inviteCode: code,
    createdAt: serverTimestamp(),
  })
  function create(inviteFamily: string, inviteBy: string, code = 'WXYZ6789') {
    const db = asUser(env, 'carol')
    const b = writeBatch(db)
    b.set(doc(db, 'families/F3'), fam(code))
    b.set(doc(db, `invites/${code}`), {
      familyId: inviteFamily,
      familyName: 'Nova',
      createdBy: inviteBy,
      createdAt: serverTimestamp(),
    })
    b.update(doc(db, 'users/carol'), { familyId: 'F3' })
    return b.commit()
  }

  it('denies invite for another family or by another uid; allows own (control)', async () => {
    await assertFails(create('F1', 'carol'))
    await assertFails(create('F3', 'alice'))
    await assertSucceeds(create('F3', 'carol'))
  })

  it('denies reusing an existing foreign invite code; allows a fresh code (control)', async () => {
    await assertFails(create('F3', 'carol', 'ABCD2345'))
    await assertSucceeds(create('F3', 'carol', 'WXYZ6789'))
  })

  it('denies overwriting a foreign invite directly; allows a new id (control)', async () => {
    const a = asUser(env, 'alice')
    const body = {
      familyId: 'F1',
      familyName: 'Casa',
      createdBy: 'alice',
      createdAt: serverTimestamp(),
    }
    await assertFails(
      setDoc(doc(asUser(env, 'bob'), 'invites/ABCD2345'), {
        ...body,
        familyId: 'F2',
        familyName: 'Outra',
        createdBy: 'bob',
      }),
    )
    await assertFails(setDoc(doc(a, 'invites/BBBB2345'), body))
    await assertSucceeds(setDoc(doc(a, 'invites/WXYZ6789'), body))
  })
})

describe('S-076 AC7: deleting and updating invites', () => {
  it('denies non-member and anonymous delete, allows member (control)', async () => {
    await assertFails(deleteDoc(doc(asUser(env, 'carol'), 'invites/ABCD2345')))
    await assertFails(deleteDoc(doc(asUser(env, 'bob'), 'invites/ABCD2345')))
    await assertFails(deleteDoc(doc(anon(env), 'invites/ABCD2345')))
    await assertSucceeds(deleteDoc(doc(asUser(env, 'alice'), 'invites/ABCD2345')))
  })

  it('denies any update, even by a member; delete still allowed (control)', async () => {
    const a = asUser(env, 'alice')
    await assertFails(updateDoc(doc(a, 'invites/ABCD2345'), { familyName: 'Casa' }))
    await assertFails(updateDoc(doc(a, 'invites/ABCD2345'), { familyId: 'F2' }))
    await assertSucceeds(deleteDoc(doc(a, 'invites/ABCD2345')))
  })
})

describe('S-076 gaps: re-join and extra keys', () => {
  it('denies an existing member re-joining, allows a free user (control)', async () => {
    await assertFails(join('alice', 'F1', ['alice', 'alice']))
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol']))
  })
  it('denies an extra key in the join payload, allows the exact payload (control)', async () => {
    const db = asUser(env, 'dave')
    const bad = writeBatch(db)
    bad.update(doc(db, 'families/F1'), {
      members: ['alice', 'dave'],
      joinCode: 'ABCD2345',
      ownerId: 'dave',
    })
    bad.update(doc(db, 'users/dave'), { familyId: 'F1' })
    await assertFails(bad.commit())
    await assertSucceeds(join('dave', 'F1', ['alice', 'dave']))
  })
})
