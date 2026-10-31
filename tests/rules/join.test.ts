import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-join')
})
afterAll(async () => {
  await env.cleanup()
})

const nine = Array.from({ length: 9 }, (_, i) => `m${i}`)

beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': { name: 'Casa', members: ['alice'], ownerId: 'alice', createdAt: new Date() },
    'families/F1/items/x': { name: 'leite' },
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    'families/F2/items/y': { name: 'pao' },
    'families/FULL': { name: 'Cheia', members: nine, ownerId: 'm0', createdAt: new Date() },
    'families/FULL10': {
      name: 'Lotada',
      members: [...nine, 'm9'],
      ownerId: 'm0',
      createdAt: new Date(),
    },
    'invites/ABCD2345': { familyId: 'F1', createdBy: 'alice', createdAt: new Date() },
    'invites/BBBB2345': { familyId: 'F2', createdBy: 'bob', createdAt: new Date() },
    'invites/NNNN2345': { familyId: 'FULL', createdBy: 'm0', createdAt: new Date() },
    'invites/TENN2345': { familyId: 'FULL10', createdBy: 'm0', createdAt: new Date() },
    'users/carol': {
      displayName: 'Carol',
      email: 'c@x.com',
      familyId: null,
      createdAt: new Date(),
    },
  })
})

/** Commits the "join" batch; `fam` overrides the family update, `userFamily` the profile. */
function join(
  uid: string,
  familyId: string,
  members: string[],
  fam: Record<string, unknown> = {},
  userFamily: string | null = familyId,
) {
  const db = asUser(env, uid)
  const b = writeBatch(db)
  b.update(doc(db, `families/${familyId}`), { members, joinCode: 'ABCD2345', ...fam })
  b.set(doc(db, `users/${uid}`), {
    displayName: 'Carol',
    email: 'c@x.com',
    familyId: userFamily,
    createdAt: serverTimestamp(),
  })
  return b.commit()
}

describe('S-008 AC3: joining a family', () => {
  it('allows the join batch with a valid code', async () => {
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol']))
  })

  it('allows joining up to the 10th member', async () => {
    await assertSucceeds(join('carol', 'FULL', [...nine, 'carol'], { joinCode: 'NNNN2345' }))
  })
})

describe('S-008 AC4: joining is denied when abusive', () => {
  it('denies a nonexistent joinCode', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'carol'], { joinCode: 'ZZZZ2345' }))
  })

  it('denies a malformed joinCode', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'carol'], { joinCode: 'abc' }))
    await assertFails(join('carol', 'F1', ['alice', 'carol'], { joinCode: 5 }))
  })

  it('denies joining without any joinCode', async () => {
    const db = asUser(env, 'carol')
    await assertFails(setDocUpdate(db, { members: ['alice', 'carol'] }))
  })

  it('denies a code that points to another family (cross-family)', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'carol'], { joinCode: 'BBBB2345' }))
    await assertFails(join('carol', 'F2', ['bob', 'carol'])) // ABCD2345 belongs to F1
  })

  it('denies adding a uid other than your own', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'dave']))
    await assertFails(join('carol', 'F1', ['alice', 'carol', 'dave']))
  })

  it('denies removing, replacing or reordering members', async () => {
    await assertFails(join('carol', 'F1', ['carol']))
    await assertFails(join('carol', 'F1', ['carol', 'alice']))
    await assertFails(join('carol', 'F1', ['alice']))
  })

  it('denies changing other fields', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'carol'], { name: 'Hacked' }))
    await assertFails(join('carol', 'F1', ['alice', 'carol'], { ownerId: 'carol' }))
    await assertFails(join('carol', 'F1', ['alice', 'carol'], { extra: 1 }))
  })

  it('denies a replay by someone who is already a member', async () => {
    await assertFails(join('alice', 'F1', ['alice', 'alice']))
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol']))
    await assertFails(join('carol', 'F1', ['alice', 'carol', 'carol']))
  })

  it('denies exceeding 10 members', async () => {
    await assertFails(join('carol', 'FULL10', [...nine, 'm9', 'carol'], { joinCode: 'TENN2345' }))
  })

  it('denies a family update without the batch profile when claiming a foreign familyId', async () => {
    await assertFails(join('carol', 'F1', ['alice', 'carol'], {}, 'F2'))
  })

  it('denies pointing the profile at a family that was not joined', async () => {
    const db = asUser(env, 'carol')
    await assertFails(
      setDoc(doc(db, 'users/carol'), {
        displayName: 'Carol',
        email: 'c@x.com',
        familyId: 'F1',
        createdAt: serverTimestamp(),
      }),
    )
  })
})

describe('S-008 AC6: access after joining', () => {
  it('lets the new member read items and stays denied elsewhere', async () => {
    await assertSucceeds(join('carol', 'F1', ['alice', 'carol']))
    const db = asUser(env, 'carol')
    await assertSucceeds(getDoc(doc(db, 'families/F1')))
    await assertSucceeds(getDoc(doc(db, 'families/F1/items/x')))
    await assertFails(getDoc(doc(db, 'families/F2')))
    await assertFails(getDoc(doc(db, 'families/F2/items/y')))
  })
})

async function setDocUpdate(db: ReturnType<typeof asUser>, data: Record<string, unknown>) {
  const { updateDoc } = await import('firebase/firestore')
  return updateDoc(doc(db, 'families/F1'), data)
}
