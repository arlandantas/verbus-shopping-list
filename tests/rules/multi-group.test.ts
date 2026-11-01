import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { asUser, seed, setupEnv } from './support'

// S-087 / ADR-0024: users.groupIds ledger (append-only, max 10).
let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-multigroup')
})
afterAll(async () => {
  await env.cleanup()
})

const now = () => new Date()
const fam = (members: string[], code: string, owner = members[0]) => ({
  name: 'G',
  members,
  ownerId: owner,
  inviteCode: code,
  createdAt: now(),
})
const inv = (familyId: string, createdBy: string) => ({
  familyId,
  familyName: 'G',
  createdBy,
  createdAt: now(),
})
const prof = (extra: Record<string, unknown>) => ({
  displayName: 'U',
  email: '',
  createdAt: now(),
  ...extra,
})

beforeEach(async () => {
  await env.clearFirestore()
  const ten = Array.from({ length: 10 }, (_, i) => `G${i}`)
  await seed(env, {
    'families/A': fam(['ana', 'leo'], 'AAAA2345', 'ana'),
    'families/B': fam(['bia'], 'BBBB2345'),
    'families/C': fam(['bia'], 'CCCC2345'),
    'invites/AAAA2345': inv('A', 'ana'),
    'invites/BBBB2345': inv('B', 'bia'),
    'invites/CCCC2345': inv('C', 'bia'),
    // ana: new-style ledger [A]; leo: legacy familyId A; zed: nobody's member, empty ledger
    'users/ana': prof({ groupIds: ['A'] }),
    'users/leo': prof({ familyId: 'A' }),
    'users/zed': prof({ groupIds: [] }),
    'users/bia': prof({ groupIds: [] }),
    // max: member of 10 groups, ledger full
    'users/max': prof({ groupIds: ten }),
    ...Object.fromEntries(
      ten.map((g) => [`families/${g}`, fam(['max'], `${g.padEnd(4, 'X')}2345`)]),
    ),
  })
})

const newFamily = (uid: string, id: string, code: string, ledger: string[] | null) => {
  const db = asUser(env, uid)
  const b = writeBatch(db)
  b.set(doc(db, `families/${id}`), {
    name: 'Nova',
    members: [uid],
    ownerId: uid,
    inviteCode: code,
    createdAt: serverTimestamp(),
  })
  b.set(doc(db, `invites/${code}`), {
    familyId: id,
    familyName: 'Nova',
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  if (ledger) b.update(doc(db, `users/${uid}`), { groupIds: ledger })
  return b.commit()
}

const joinBatch = (uid: string, id: string, code: string, members: string[], ledger: string[]) => {
  const db = asUser(env, uid)
  const b = writeBatch(db)
  b.update(doc(db, `families/${id}`), { members, joinCode: code })
  b.update(doc(db, `users/${uid}`), { groupIds: ledger })
  return b.commit()
}

describe('S-087 AC1: new profile', () => {
  const create = (uid: string, extra: Record<string, unknown>) =>
    setDoc(doc(asUser(env, uid), `users/${uid}`), {
      displayName: 'N',
      email: '',
      createdAt: serverTimestamp(),
      ...extra,
    })
  it('denies non-empty groupIds or any familyId; allows groupIds [] (control)', async () => {
    await assertFails(create('new1', { groupIds: ['A'] }))
    await assertFails(create('new1', { groupIds: [], familyId: 'A' }))
    await assertFails(create('new1', { groupIds: [], familyId: null }))
    await assertFails(create('new1', {}))
    await assertSucceeds(create('new1', { groupIds: [] }))
  })
})

describe('S-087 AC2: create a second group', () => {
  it('allows base+[B], denies no append or a foreign id (control first)', async () => {
    await assertFails(newFamily('ana', 'N1', 'NEWW2345', null))
    await assertFails(newFamily('ana', 'N1', 'NEWW2345', ['A']))
    await assertFails(newFamily('ana', 'N1', 'NEWW2345', ['A', 'B']))
    await assertFails(newFamily('ana', 'N1', 'NEWW2345', ['N1']))
    await assertFails(newFamily('ana', 'N1', 'NEWW2345', ['A', 'N1', 'N1']))
    await assertSucceeds(newFamily('ana', 'N1', 'NEWW2345', ['A', 'N1']))
  })
  it('a profile with an empty ledger creates its first group', async () => {
    await assertSucceeds(newFamily('zed', 'N2', 'NEWW2345', ['N2']))
  })
})

describe('S-087 AC3: join a second group', () => {
  it('allows the append; denies re-joining a group the user is in', async () => {
    await assertFails(joinBatch('ana', 'A', 'AAAA2345', ['ana', 'leo', 'ana'], ['A', 'A']))
    await assertFails(joinBatch('ana', 'B', 'BBBB2345', ['bia', 'ana'], ['A']))
    await assertSucceeds(joinBatch('ana', 'B', 'BBBB2345', ['bia', 'ana'], ['A', 'B']))
  })
})

describe('S-087 AC4: legacy profile', () => {
  it('joins B with [A, B]; denies [B] and familyId changes', async () => {
    await assertFails(joinBatch('leo', 'B', 'BBBB2345', ['bia', 'leo'], ['B']))
    await assertFails(joinBatch('leo', 'B', 'BBBB2345', ['bia', 'leo'], ['B', 'A']))
    const db = asUser(env, 'leo')
    await assertFails(updateDoc(doc(db, 'users/leo'), { familyId: 'B' }))
    await assertFails(updateDoc(doc(db, 'users/leo'), { familyId: null }))
    const bad = writeBatch(db)
    bad.update(doc(db, 'families/B'), { members: ['bia', 'leo'], joinCode: 'BBBB2345' })
    bad.update(doc(db, 'users/leo'), { groupIds: ['A', 'B'], familyId: 'B' })
    await assertFails(bad.commit())
    await assertSucceeds(joinBatch('leo', 'B', 'BBBB2345', ['bia', 'leo'], ['A', 'B']))
  })
  it('legacy profile can still edit its name', async () => {
    await assertSucceeds(updateDoc(doc(asUser(env, 'leo'), 'users/leo'), { displayName: 'L' }))
  })
})

describe('S-087 AC5: limit of 10', () => {
  it('denies the 11th group by create or join; allows the 10th (control)', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => `G${i}`)
    await assertFails(newFamily('max', 'N3', 'NEWW2345', [...ten, 'N3']))
    await assertFails(joinBatch('max', 'B', 'BBBB2345', ['bia', 'max'], [...ten, 'B']))
    // control: 9 groups -> the 10th is accepted
    await seed(env, { 'users/max': prof({ groupIds: ten.slice(0, 9) }) })
    await assertSucceeds(newFamily('max', 'N3', 'NEWW2345', [...ten.slice(0, 9), 'N3']))
  })
})

describe('S-087 AC6: two joins in one batch', () => {
  it('denies joining B and C with a single append; allows one join (control)', async () => {
    const db = asUser(env, 'zed')
    const two = writeBatch(db)
    two.update(doc(db, 'families/B'), { members: ['bia', 'zed'], joinCode: 'BBBB2345' })
    two.update(doc(db, 'families/C'), { members: ['bia', 'zed'], joinCode: 'CCCC2345' })
    two.update(doc(db, 'users/zed'), { groupIds: ['B'] })
    await assertFails(two.commit())
    const both = writeBatch(db)
    both.update(doc(db, 'families/B'), { members: ['bia', 'zed'], joinCode: 'BBBB2345' })
    both.update(doc(db, 'families/C'), { members: ['bia', 'zed'], joinCode: 'CCCC2345' })
    both.update(doc(db, 'users/zed'), { groupIds: ['B', 'C'] })
    await assertFails(both.commit())
    await assertSucceeds(joinBatch('zed', 'B', 'BBBB2345', ['bia', 'zed'], ['B']))
  })
  it('denies create + join in one batch with a single append', async () => {
    const db = asUser(env, 'ana')
    const b = writeBatch(db)
    b.set(doc(db, 'families/N4'), fam(['ana'], 'NEWW2345'))
    b.set(doc(db, 'invites/NEWW2345'), {
      familyId: 'N4',
      familyName: 'G',
      createdBy: 'ana',
      createdAt: serverTimestamp(),
    })
    b.update(doc(db, 'families/B'), { members: ['bia', 'ana'], joinCode: 'BBBB2345' })
    b.update(doc(db, 'users/ana'), { groupIds: ['A', 'B'] })
    await assertFails(b.commit())
  })
})

describe('S-087 AC7: isolated updates to users', () => {
  const upd = (uid: string, groupIds: unknown) =>
    updateDoc(doc(asUser(env, uid), `users/${uid}`), { groupIds })
  it('denies remove, reorder, duplicate, foreign append; allows no-op/rename (control)', async () => {
    await seed(env, {
      'users/ana': prof({ groupIds: ['A', 'B'] }),
      'families/B': fam(['ana'], 'BBBB2345'),
    })
    await assertFails(upd('ana', ['A']))
    await assertFails(upd('ana', []))
    await assertFails(upd('ana', ['B', 'A']))
    await assertFails(upd('ana', ['A', 'B', 'B']))
    await assertFails(upd('ana', ['A', 'B', 'C'])) // C: ana is not a member
    await assertFails(upd('ana', ['A', 'B', 7]))
    await assertFails(upd('ana', 'A'))
    await assertSucceeds(upd('ana', ['A', 'B']))
    await assertSucceeds(updateDoc(doc(asUser(env, 'ana'), 'users/ana'), { displayName: 'X' }))
  })
  it('denies a legacy profile wiping the ledger by dropping familyId or rewriting groupIds', async () => {
    await assertFails(upd('leo', ['B']))
    await assertFails(upd('leo', []))
  })
  it('allows appending a group the user belongs to (isolated)', async () => {
    await seed(env, { 'families/B': fam(['bia', 'ana'], 'BBBB2345') })
    await assertSucceeds(upd('ana', ['A', 'B']))
  })
})

describe('S-087 AC8: group discovery query', () => {
  it('returns only the groups of the user; unfiltered query is denied', async () => {
    await seed(env, { 'families/B': fam(['bia', 'ana'], 'BBBB2345') })
    const db = asUser(env, 'ana')
    const snap = await assertSucceeds(
      getDocs(query(collection(db, 'families'), where('members', 'array-contains', 'ana'))),
    )
    expect(snap.docs.map((d) => d.id).sort()).toEqual(['A', 'B'])
    await assertFails(getDocs(collection(db, 'families')))
    await assertFails(
      getDocs(query(collection(db, 'families'), where('members', 'array-contains', 'bia'))),
    )
  })
})
