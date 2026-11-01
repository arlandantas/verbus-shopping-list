import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  arrayUnion,
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
  env = await setupEnv('demo-verbus-members')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/f1': { name: 'Casa', members: ['alice', 'bob'], ownerId: 'alice' },
    'families/f2': { name: 'Outra', members: ['carol'], ownerId: 'carol' },
    'families/f1/members/bob': { displayName: 'Bob' },
    'users/carol': {
      displayName: 'Carol',
      email: 'c@x.com',
      familyId: null,
      createdAt: new Date(),
    },
    'invites/ABCD2345': {
      familyId: 'f1',
      familyName: 'Casa',
      createdBy: 'alice',
      createdAt: new Date(),
    },
  })
})

const mine = (uid: string, fam = 'f1') => `families/${fam}/members/${uid}`

describe('S-026 members rules', () => {
  it('S-026 AC1: member creates and updates own profile (1-60)', async () => {
    const db = asUser(env, 'alice')
    await assertSucceeds(setDoc(doc(db, mine('alice')), { displayName: 'Alice' }))
    await assertSucceeds(setDoc(doc(db, mine('alice')), { displayName: 'A'.repeat(60) }))
    await assertSucceeds(updateDoc(doc(db, mine('alice')), { displayName: 'A' }))
  })

  it('S-026 AC2: members read others and list; outsiders denied', async () => {
    const alice = asUser(env, 'alice')
    await assertSucceeds(getDoc(doc(alice, mine('bob'))))
    await assertSucceeds(getDocs(collection(alice, 'families/f1/members')))
    const carol = asUser(env, 'carol')
    await assertFails(getDoc(doc(carol, mine('bob'))))
    await assertFails(getDocs(collection(carol, 'families/f1/members')))
    await assertFails(getDoc(doc(asUser(env, 'dave'), mine('bob'))))
    await assertFails(getDoc(doc(anon(env), mine('bob'))))
    await assertFails(getDocs(collection(anon(env), 'families/f1/members')))
  })

  it('S-026 AC3: cannot write another uid doc or as non-member', async () => {
    const alice = asUser(env, 'alice')
    await assertFails(setDoc(doc(alice, mine('bob')), { displayName: 'Hack' }))
    await assertFails(updateDoc(doc(alice, mine('bob')), { displayName: 'Hack' }))
    await assertFails(setDoc(doc(asUser(env, 'carol'), mine('carol')), { displayName: 'C' }))
    await assertFails(setDoc(doc(anon(env), mine('alice')), { displayName: 'A' }))
    // member of f2 cannot write into f1 even for own uid
    await assertFails(setDoc(doc(asUser(env, 'dave'), mine('dave')), { displayName: 'D' }))
  })

  it('S-026 AC4: invalid shape, extra keys and delete denied', async () => {
    const db = asUser(env, 'alice')
    const ref = doc(db, mine('alice'))
    await assertFails(setDoc(ref, { displayName: '' }))
    await assertFails(setDoc(ref, { displayName: 'A'.repeat(61) }))
    await assertFails(setDoc(ref, { displayName: 42 }))
    await assertFails(setDoc(ref, { displayName: null }))
    await assertFails(setDoc(ref, {}))
    await assertFails(setDoc(ref, { displayName: 'A', role: 'admin' }))
    await assertSucceeds(setDoc(ref, { displayName: 'Alice' }))
    await assertFails(updateDoc(ref, { extra: 1 }))
    await assertFails(deleteDoc(ref))
  })

  it('member profile in the same batch as join is allowed; for a non-joining uid it is denied', async () => {
    const carol = asUser(env, 'carol')
    const join = (profileUid: string) => {
      const b = writeBatch(carol)
      b.update(doc(carol, 'families/f1'), { members: arrayUnion('carol'), joinCode: 'ABCD2345' })
      b.update(doc(carol, 'users/carol'), { groupIds: ['f1'] })
      b.set(doc(carol, mine(profileUid)), { displayName: 'Carol' })
      return b.commit()
    }
    await assertFails(join('bob'))
    await assertSucceeds(join('carol'))
  })

  it('member profile in the create-family batch is allowed; without joining the family it is denied', async () => {
    const carol = asUser(env, 'carol')
    const base = (b: ReturnType<typeof writeBatch>, id: string) => {
      b.set(doc(carol, `families/${id}`), {
        name: 'Nova',
        members: ['carol'],
        ownerId: 'carol',
        inviteCode: 'WXYZ6789',
        createdAt: serverTimestamp(),
      })
      b.set(doc(carol, 'invites/WXYZ6789'), {
        familyId: id,
        familyName: 'Nova',
        createdBy: 'carol',
        createdAt: serverTimestamp(),
      })
      b.update(doc(carol, 'users/carol'), { groupIds: [id] })
    }
    const ok = writeBatch(carol)
    base(ok, 'f3')
    ok.set(doc(carol, mine('carol', 'f3')), { displayName: 'Carol' })
    await assertSucceeds(ok.commit())
    // standalone write into a family the caller does not belong to stays denied
    await assertFails(setDoc(doc(carol, mine('carol', 'f1')), { displayName: 'Carol' }))
  })
})
