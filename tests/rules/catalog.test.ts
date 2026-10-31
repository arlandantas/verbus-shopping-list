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
  writeBatch,
} from 'firebase/firestore'
import { anon, asUser, setupEnv } from './support'
import { entry, seedCatalogFamilies } from './catalogSupport'

let env: RulesTestEnvironment

const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'pct', 'cx', 'dz']

const newItem = (over: Record<string, unknown> = {}) => ({
  name: 'Leite',
  nameKey: 'leite',
  quantity: 1,
  unit: 'un',
  note: null,
  categoryId: null,
  recurring: false,
  status: 'pending',
  markedBy: null,
  markedAt: null,
  priceCents: null,
  createdBy: 'alice',
  createdAt: serverTimestamp(),
  ...over,
})

beforeAll(async () => {
  env = await setupEnv('demo-verbus-catalog')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await seedCatalogFamilies(env)
})

const alice = () => asUser(env, 'alice')
const cat = (db: ReturnType<typeof alice>, id = 'leite') => doc(db, `families/F1/catalog/${id}`)

describe('S-016 AC1: members read and write valid entries', () => {
  it('creates a new entry', async () => {
    await assertSucceeds(setDoc(cat(alice(), 'cafe'), entry({ name: 'Café', nameKey: 'cafe' })))
  })

  it('sets again on the same id (update), by any member', async () => {
    await assertSucceeds(setDoc(cat(alice()), entry({ quantity: 2, unit: 'l' })))
    await assertSucceeds(
      setDoc(cat(asUser(env, 'dave')), entry({ name: 'LEITE', categoryId: 'c1' })),
    )
  })

  it('gets and lists', async () => {
    await assertSucceeds(getDoc(cat(alice())))
    await assertSucceeds(getDocs(collection(alice(), 'families/F1/catalog')))
  })

  it.each(UNITS)('accepts unit %s', async (unit) => {
    await assertSucceeds(setDoc(cat(alice(), 'u'), entry({ nameKey: 'u', unit })))
  })

  it('accepts decimals, bounds and a categoryId', async () => {
    await assertSucceeds(setDoc(cat(alice(), 'a'), entry({ nameKey: 'a', quantity: 0.5 })))
    await assertSucceeds(setDoc(cat(alice(), 'b'), entry({ nameKey: 'b', quantity: 9999 })))
    await assertSucceeds(
      setDoc(cat(alice(), 'c'), entry({ nameKey: 'c', categoryId: 'x'.repeat(40) })),
    )
    await assertSucceeds(
      setDoc(
        cat(alice(), 'pao de forma'),
        entry({ nameKey: 'pao de forma', name: 'x'.repeat(80) }),
      ),
    )
  })
})

describe('S-016 AC2: denied shapes', () => {
  const deny = (label: string, id: string, over: Record<string, unknown>) =>
    it(`denies ${label}`, async () => {
      await assertFails(setDoc(cat(alice(), id), entry({ nameKey: id, ...over })))
    })

  it.each([['Leite'], ['leite  x'], [' leite'], ['leite-x'], ['pão'], ['a/b']])(
    'denies id %j (outside nameKey regex)',
    async (id) => {
      if (id.includes('/')) return // not addressable as a single doc id
      await assertFails(setDoc(cat(alice(), id), entry({ nameKey: id })))
    },
  )
  it('denies nameKey different from id', async () => {
    await assertFails(setDoc(cat(alice(), 'leite'), entry({ nameKey: 'outro' })))
  })
  it('denies an id longer than 80 chars', async () => {
    const id = 'a'.repeat(81)
    await assertFails(setDoc(cat(alice(), id), entry({ nameKey: id })))
  })
  it('denies extra key', async () => {
    await assertFails(setDoc(cat(alice()), { ...entry(), createdBy: 'alice' }))
  })
  it.each(['name', 'nameKey', 'quantity', 'unit', 'categoryId', 'lastUsedAt'])(
    'denies missing key %s',
    async (key) => {
      const data: Record<string, unknown> = entry()
      delete data[key]
      await assertFails(setDoc(cat(alice()), data))
    },
  )
  deny('quantity 0', 'leite', { quantity: 0 })
  deny('negative quantity', 'leite', { quantity: -1 })
  deny('quantity above 9999', 'leite', { quantity: 10000 })
  deny('string quantity', 'leite', { quantity: '1' })
  deny('unknown unit', 'leite', { unit: 'lt' })
  deny('uppercase unit', 'leite', { unit: 'KG' })
  deny('empty categoryId', 'leite', { categoryId: '' })
  deny('categoryId over 40', 'leite', { categoryId: 'x'.repeat(41) })
  deny('numeric categoryId', 'leite', { categoryId: 5 })
  deny('empty name', 'leite', { name: '' })
  deny('name over 80', 'leite', { name: 'x'.repeat(81) })
  deny('non-string name', 'leite', { name: 7 })
  deny('client lastUsedAt', 'leite', { lastUsedAt: new Date() })
  deny('null lastUsedAt', 'leite', { lastUsedAt: null })
  deny('string lastUsedAt', 'leite', { lastUsedAt: 'now' })
})

describe('S-016 AC3: delete is denied', () => {
  it('denies delete even for members', async () => {
    await assertFails(deleteDoc(cat(alice())))
    await assertFails(deleteDoc(cat(asUser(env, 'dave'))))
  })
})

describe('S-016 AC4: non-members, anonymous and other families', () => {
  const outsiders = () =>
    [
      ['stranger', asUser(env, 'eve')],
      ['anonymous', anon(env)],
      ['other-family member', asUser(env, 'bob')],
    ] as const

  it.each(['stranger', 'anonymous', 'other-family member'])('denies %s', async (who) => {
    const db = outsiders().find(([n]) => n === who)![1]
    await assertFails(getDoc(cat(db)))
    await assertFails(getDocs(collection(db, 'families/F1/catalog')))
    await assertFails(setDoc(cat(db), entry()))
    await assertFails(setDoc(cat(db, 'novo'), entry({ nameKey: 'novo' })))
    await assertFails(deleteDoc(cat(db)))
  })

  it('denies a member of F1 touching F2', async () => {
    const f2 = doc(alice(), 'families/F2/catalog/arroz')
    await assertFails(getDoc(f2))
    await assertFails(setDoc(f2, entry({ name: 'Arroz', nameKey: 'arroz' })))
    await assertFails(setDoc(doc(alice(), 'families/F2/catalog/novo'), entry({ nameKey: 'novo' })))
  })
})

describe('S-016 AC5: add batch (item + catalog)', () => {
  const addBatch = (catalog: Record<string, unknown>, item = newItem()) => {
    const db = alice()
    const b = writeBatch(db)
    b.set(doc(db, 'families/F1/items/i1'), item)
    b.set(doc(db, 'families/F1/catalog/leite'), catalog)
    return b.commit()
  }

  it('allows a valid item with a valid catalog entry', async () => {
    await assertSucceeds(addBatch(entry()))
  })

  it('fails the whole batch when the catalog entry is invalid', async () => {
    await assertFails(addBatch(entry({ unit: 'lt' })))
    await assertFails(addBatch(entry({ lastUsedAt: new Date() })))
    await assertFails(addBatch({ ...entry(), extra: 1 }))
    await assertSucceeds(
      getDoc(doc(alice(), 'families/F1/items/i1')).then((s) => {
        if (s.exists()) throw new Error('item persisted')
      }),
    )
  })

  it('fails the whole batch when the item is invalid but the catalog is valid', async () => {
    await assertFails(addBatch(entry(), newItem({ status: 'bought' })))
  })
})
