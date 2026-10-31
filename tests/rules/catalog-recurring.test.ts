import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { anon, asUser, setupEnv } from './support'
import { entry, seedCatalogFamilies } from './catalogSupport'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-catalog-recurring')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await seedCatalogFamilies(env)
})

const alice = () => asUser(env, 'alice')
const cat = (db: ReturnType<typeof alice>, id = 'leite') => doc(db, `families/F1/catalog/${id}`)

describe('S-022 AC1: recurring is optional', () => {
  it('creates without recurring and with recurring true/false', async () => {
    await assertSucceeds(setDoc(cat(alice(), 'cafe'), entry({ name: 'Café', nameKey: 'cafe' })))
    await assertSucceeds(
      setDoc(cat(alice(), 'pao'), entry({ name: 'Pão', nameKey: 'pao', recurring: true })),
    )
    await assertSucceeds(
      setDoc(cat(alice(), 'sal'), entry({ name: 'Sal', nameKey: 'sal', recurring: false })),
    )
  })
})

describe('S-022 AC2: merge writes validate the resulting doc', () => {
  it('allows merging only recurring + lastUsedAt over an existing entry', async () => {
    await assertSucceeds(
      setDoc(cat(alice()), { recurring: true, lastUsedAt: serverTimestamp() }, { merge: true }),
    )
    const snap = await getDoc(cat(alice()))
    expect(snap.data()?.recurring).toBe(true)
    expect(snap.data()?.name).toBe('Leite')
  })

  it('keeps recurring when a later merge omits it', async () => {
    await assertSucceeds(
      setDoc(cat(alice()), { recurring: true, lastUsedAt: serverTimestamp() }, { merge: true }),
    )
    await assertSucceeds(
      setDoc(cat(alice()), { quantity: 2, lastUsedAt: serverTimestamp() }, { merge: true }),
    )
    expect((await getDoc(cat(alice()))).data()?.recurring).toBe(true)
  })

  it('denies the same partial merge over a missing entry', async () => {
    await assertFails(
      setDoc(
        cat(alice(), 'novo'),
        { recurring: true, lastUsedAt: serverTimestamp() },
        { merge: true },
      ),
    )
  })

  it('denies a merge that makes the merged doc invalid', async () => {
    await assertFails(
      setDoc(cat(alice()), { unit: 'lt', lastUsedAt: serverTimestamp() }, { merge: true }),
    )
    await assertFails(
      setDoc(cat(alice()), { extra: 1, lastUsedAt: serverTimestamp() }, { merge: true }),
    )
  })
})

describe('S-022 AC3: recurring must be a bool; no extra keys', () => {
  it.each([['sim'], [1], [null]])('denies recurring = %j', async (v) => {
    await assertFails(setDoc(cat(alice(), 'cafe'), entry({ nameKey: 'cafe', recurring: v })))
    await assertFails(
      setDoc(cat(alice()), { recurring: v, lastUsedAt: serverTimestamp() }, { merge: true }),
    )
  })

  it('denies extra / forged keys', async () => {
    await assertFails(setDoc(cat(alice(), 'cafe'), entry({ nameKey: 'cafe', extra: true })))
    await assertFails(
      setDoc(cat(alice(), 'cafe'), entry({ nameKey: 'cafe', recurring: true, cycle: 1 })),
    )
  })
})

describe('S-022 AC4: timestamp, membership and delete', () => {
  it('denies lastUsedAt different from request.time', async () => {
    await assertFails(
      setDoc(cat(alice()), { recurring: true, lastUsedAt: new Date() }, { merge: true }),
    )
    await assertFails(setDoc(cat(alice()), { recurring: true }, { merge: true }))
  })

  it('denies non-members, anonymous and other families', async () => {
    const patch = { recurring: true, lastUsedAt: serverTimestamp() }
    await assertFails(setDoc(cat(asUser(env, 'bob')), patch, { merge: true }))
    await assertFails(setDoc(cat(anon(env)), patch, { merge: true }))
    await assertFails(setDoc(doc(alice(), 'families/F2/catalog/arroz'), patch, { merge: true }))
    await assertFails(
      setDoc(cat(asUser(env, 'bob'), 'cafe'), entry({ nameKey: 'cafe', recurring: true })),
    )
  })

  it('denies delete', async () => {
    await assertFails(deleteDoc(cat(alice())))
  })
})
