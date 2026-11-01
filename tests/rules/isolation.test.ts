import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { anon, asUser, newCycle, newPurchase, newPurchaseLine, seed, setupEnv } from './support'
import { newItem, seedItem } from './itemsSupport'
import { entry } from './catalogSupport'

let env: RulesTestEnvironment

type Spec = {
  existing: string
  fresh: string
  seedData: () => Record<string, unknown>
  create: (uid: string) => Promise<Record<string, unknown>> | Record<string, unknown>
  update: () => Record<string, unknown>
  canUpdate: boolean
  canDelete: boolean
  /** members docs are keyed by the actor's own uid. */
  ownUid?: boolean
}

const SPECS: Record<string, Spec> = {
  items: {
    existing: 'x',
    fresh: 'new',
    seedData: () => seedItem(),
    create: (uid) => newItem({ createdBy: uid }),
    update: () => ({ name: 'Z', nameKey: 'z' }),
    canUpdate: true,
    canDelete: true,
  },
  catalog: {
    existing: 'leite',
    fresh: 'cafe',
    seedData: () => ({ ...entry(), lastUsedAt: new Date() }),
    create: () => entry({ name: 'Café', nameKey: 'cafe' }),
    update: () => ({ quantity: 2, lastUsedAt: serverTimestamp() }),
    canUpdate: true,
    canDelete: false,
  },
  categories: {
    existing: 'mine',
    fresh: 'pets',
    seedData: () => ({ name: 'Pets', isDefault: false, order: 6 }),
    create: () => ({ name: 'Novo', isDefault: false, order: 7 }),
    update: () => ({ name: 'Z' }),
    canUpdate: true,
    canDelete: true,
  },
  members: {
    existing: 'alice',
    fresh: 'alice',
    seedData: () => ({ displayName: 'Alice' }),
    create: () => ({ displayName: 'Nome' }),
    update: () => ({ displayName: 'Z' }),
    canUpdate: true,
    canDelete: false,
    ownUid: true,
  },
  purchases: {
    existing: 'P1',
    fresh: 'P2',
    seedData: () => ({ ...validPurchaseSeed }),
    create: (uid) => newPurchase({ createdBy: uid }),
    update: () => ({ totalCents: 500 }),
    canUpdate: true,
    canDelete: false,
  },
  purchaseLines: {
    existing: 'L1',
    fresh: 'L2',
    seedData: () => ({ ...validPurchaseSeed, name: 'Leite', quantity: 1, unit: 'un' }),
    create: () => newPurchaseLine(),
    update: () => ({ priceCents: 500 }),
    canUpdate: true,
    canDelete: false,
  },
  cycles: {
    existing: '2026-09',
    fresh: '2026-10',
    seedData: () => ({ openedBy: 'alice', openedAt: new Date(), recurringAdded: 1 }),
    create: (uid) => newCycle({ openedBy: uid }),
    update: () => ({ recurringAdded: 2 }),
    canUpdate: false,
    canDelete: false,
  },
}
const validPurchaseSeed = { cycle: '2026-09', market: 'M', totalCents: 100, priceCents: 100 }
const SUBS = Object.keys(SPECS)

async function seedAll() {
  const docs: Record<string, Record<string, unknown>> = {
    'users/alice': { name: 'Alice' },
    'users/bob': { name: 'Bob' },
    'invites/ABCDEFGH': { familyId: 'F1', createdBy: 'alice' },
  }
  for (const [fid, owner] of [
    ['F1', 'alice'],
    ['F2', 'bob'],
  ] as const) {
    docs[`families/${fid}`] = { name: fid, members: [owner] }
    for (const s of SUBS) {
      const id = SPECS[s]!.ownUid ? owner : SPECS[s]!.existing
      docs[`families/${fid}/${s}/${id}`] = SPECS[s]!.seedData()
    }
  }
  await seed(env, docs)
}

beforeAll(async () => {
  env = await setupEnv('demo-verbus-isolation')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seedAll()
})

const actors = {
  anonymous: () => anon(env),
  'no family': () => asUser(env, 'carol'),
  'other family member': () => asUser(env, 'bob'),
}
const uidOf = { anonymous: 'anon', 'no family': 'carol', 'other family member': 'bob' }

const ids = (sub: string, uid: string) => {
  const sp = SPECS[sub]!
  return { existing: sp.ownUid ? uid : sp.existing, fresh: sp.ownUid ? uid : sp.fresh }
}

describe.each(Object.keys(actors))('S-075 AC1 denied: %s', (actor) => {
  describe.each(SUBS)('families/F1/%s', (sub) => {
    it('denies get, list, create, update, delete', async () => {
      const d = actors[actor as keyof typeof actors]()
      const sp = SPECS[sub]!
      const uid = uidOf[actor as keyof typeof uidOf]
      const base = `families/F1/${sub}`
      const id = ids(sub, 'alice')
      await assertFails(getDoc(doc(d, `${base}/${id.existing}`)))
      await assertFails(getDocs(collection(d, base)))
      await assertFails(setDoc(doc(d, `${base}/${ids(sub, uid).fresh}`), await sp.create(uid)))
      await assertFails(updateDoc(doc(d, `${base}/${id.existing}`), sp.update()))
      await assertFails(deleteDoc(doc(d, `${base}/${id.existing}`)))
    })
  })
})

describe.each(SUBS)('S-075 AC1 control: F1 member alice on families/F1/%s', (sub) => {
  it('same operations are allowed where the rules allow them', async () => {
    const d = asUser(env, 'alice')
    const sp = SPECS[sub]!
    const base = `families/F1/${sub}`
    await assertSucceeds(getDoc(doc(d, `${base}/${sp.existing}`)))
    await assertSucceeds(getDocs(collection(d, base)))
    await assertSucceeds(setDoc(doc(d, `${base}/${sp.fresh}`), await sp.create('alice')))
    const upd = updateDoc(doc(d, `${base}/${sp.existing}`), sp.update())
    await (sp.canUpdate ? assertSucceeds(upd) : assertFails(upd))
    const del = deleteDoc(doc(d, `${base}/${sp.existing}`))
    await (sp.canDelete ? assertSucceeds(del) : assertFails(del))
  })
})

describe('S-075 AC2: collectionGroup without family filter', () => {
  it.each(SUBS)('denies %s for members of any family', async (sub) => {
    await assertFails(getDocs(collectionGroup(asUser(env, 'alice'), sub)))
    await assertFails(getDocs(collectionGroup(asUser(env, 'bob'), sub)))
    await assertFails(getDocs(collectionGroup(asUser(env, 'carol'), sub)))
  })
})

describe('S-075 AC3: families list', () => {
  it('denies unfiltered list', async () => {
    await assertFails(getDocs(collection(asUser(env, 'alice'), 'families')))
  })
  it('allows list filtered by own uid', async () => {
    const q = query(
      collection(asUser(env, 'alice'), 'families'),
      where('members', 'array-contains', 'alice'),
    )
    const snap = await assertSucceeds(getDocs(q))
    expect(snap.docs.map((d) => d.id)).toEqual(['F1'])
  })
  it("denies list filtered by someone else's uid", async () => {
    const q = query(
      collection(asUser(env, 'alice'), 'families'),
      where('members', 'array-contains', 'bob'),
    )
    await assertFails(getDocs(q))
  })
})

describe('S-075 AC4: invites and users enumeration', () => {
  it('denies list of invites and users', async () => {
    for (const db of [asUser(env, 'alice'), asUser(env, 'carol'), anon(env)]) {
      await assertFails(getDocs(collection(db, 'invites')))
      await assertFails(getDocs(collection(db, 'users')))
    }
  })
  it('denies get of another user', async () => {
    await assertFails(getDoc(doc(asUser(env, 'alice'), 'users/bob')))
    await assertSucceeds(getDoc(doc(asUser(env, 'alice'), 'users/alice')))
  })
})

describe('S-075 AC5: nonexistent family', () => {
  it('allows the payload for an F1 member but denies it on families/NOPE', async () => {
    const db = asUser(env, 'alice')
    await assertSucceeds(setDoc(doc(db, 'families/F1/items/n'), newItem({ createdBy: 'alice' })))
    await assertFails(setDoc(doc(db, 'families/NOPE/items/n'), newItem({ createdBy: 'alice' })))
    await assertFails(getDoc(doc(db, 'families/NOPE/items/x')))
  })
})

describe('S-075 AC6: removed member loses access immediately', () => {
  it('denies read and write after removal from members array', async () => {
    await seed(env, { 'families/F1/items/y': seedItem() })
    const db = asUser(env, 'alice')
    const payload = () => newItem({ createdBy: 'alice' })
    await assertSucceeds(getDoc(doc(db, 'families/F1/items/x')))
    await assertSucceeds(setDoc(doc(db, 'families/F1/items/n1'), payload()))
    await assertSucceeds(deleteDoc(doc(db, 'families/F1/items/y')))
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as never, 'families/F1'), { name: 'F1', members: [] })
    })
    await assertFails(getDoc(doc(db, 'families/F1/items/x')))
    await assertFails(getDocs(collection(db, 'families/F1/categories')))
    await assertFails(setDoc(doc(db, 'families/F1/items/n2'), payload()))
    await assertFails(deleteDoc(doc(db, 'families/F1/items/x')))
  })
})
