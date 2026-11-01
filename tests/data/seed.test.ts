import { TEST_ACCOUNTS } from '../../scripts/seed/accounts.ts'
import { SEED_CATEGORIES, SEED_ITEMS, SEED_CATALOG, FAMILY_ID } from '../../scripts/seed/data.ts'
import { seedEmulators } from '../../scripts/seed/index.ts'
import { DEFAULT_CATEGORIES } from '@/domain/categories'
import { toNameKey } from '@/domain/nameKey'
import { UNITS } from '@/domain/units'

const AUTH = 'http://127.0.0.1:9099'
const FS = 'http://127.0.0.1:8080'
const DOCS = `${FS}/v1/projects/demo-verbus/databases/(default)/documents`
const ADMIN = { Authorization: 'Bearer owner' }

interface Doc {
  name: string
  fields: Record<string, Record<string, unknown>>
}
const list = async (path: string): Promise<Doc[]> =>
  (((await (await fetch(`${DOCS}/${path}`, { headers: ADMIN })).json()) as { documents?: Doc[] })
    .documents ?? []) as Doc[]
const str = (d: Doc, k: string) => d.fields[k]?.stringValue as string | undefined

async function signIn(email: string, password: string) {
  const res = await fetch(
    `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  )
  return { ok: res.ok, body: (await res.json()) as { idToken: string; localId: string } }
}

beforeEach(async () => {
  await fetch(`${AUTH}/emulator/v1/projects/demo-verbus/accounts`, { method: 'DELETE' })
  await fetch(`${FS}/emulator/v1/projects/demo-verbus/databases/(default)/documents`, {
    method: 'DELETE',
  })
})

describe('S-050 seed data (pure)', () => {
  it('S-050 AC3: seed categories are the 6 ADR-0014 defaults (a legacy group, S-092 AC6)', () => {
    expect(SEED_CATEGORIES).toEqual(DEFAULT_CATEGORIES)
  })
  it('S-050 AC3: item/catalog name keys and units follow the domain', () => {
    for (const i of SEED_ITEMS) {
      expect(i.nameKey).toBe(toNameKey(i.name))
      expect(UNITS).toContain(i.unit)
    }
    for (const c of SEED_CATALOG) expect(c.nameKey).toBe(toNameKey(c.name))
  })
  it('S-050 AC2: three accounts with distinct emails, one without family', () => {
    expect(TEST_ACCOUNTS).toHaveLength(3)
    expect(new Set(TEST_ACCOUNTS.map((a) => a.email)).size).toBe(3)
    expect(TEST_ACCOUNTS.filter((a) => a.family)).toHaveLength(2)
  })
})

describe('S-050 seed against the emulators (real rules enforced)', () => {
  it('S-050 AC2/AC3: creates accounts, family, categories, items, catalog, member names', async () => {
    await seedEmulators()
    for (const a of TEST_ACCOUNTS) expect((await signIn(a.email, a.password)).ok).toBe(true)

    const fams = await list('families')
    expect(fams).toHaveLength(1)
    const members = fams[0].fields.members.arrayValue as { values: { stringValue: string }[] }
    expect(members.values).toHaveLength(2)

    const cats = await list(`families/${FAMILY_ID}/categories`)
    expect(cats.map((c) => c.name.split('/').pop()).sort()).toEqual(
      DEFAULT_CATEGORIES.map((c) => c.id).sort(),
    )

    const items = await list(`families/${FAMILY_ID}/items`)
    const statuses = items.map((i) => str(i, 'status'))
    expect(statuses).toContain('pending')
    expect(statuses).toContain('bought')
    const used = new Set(items.map((i) => str(i, 'categoryId') ?? 'none'))
    expect(used.size).toBeGreaterThanOrEqual(4)

    const catalog = await list(`families/${FAMILY_ID}/catalog`)
    expect(catalog.some((c) => c.fields.recurring?.booleanValue === true)).toBe(true)

    const names = (await list(`families/${FAMILY_ID}/members`)).map((m) => str(m, 'displayName'))
    expect(names.sort()).toEqual(
      TEST_ACCOUNTS.filter((a) => a.family)
        .map((a) => a.displayName)
        .sort(),
    )

    const users = await list('users')
    const withFamily = users.filter(
      (u) =>
        (u.fields.groupIds?.arrayValue as { values?: { stringValue: string }[] } | undefined)
          ?.values?.[0]?.stringValue === FAMILY_ID,
    )
    expect(withFamily).toHaveLength(1)
    const legacy = users.filter(
      (u) => u.fields.familyId?.stringValue === FAMILY_ID && !u.fields.groupIds,
    )
    expect(legacy).toHaveLength(1)
    expect(users).toHaveLength(3)
  })

  it('S-050 AC3: the emulator really enforces the rules on the seed credentials', async () => {
    await seedEmulators()
    const carla = TEST_ACCOUNTS.find((a) => !a.family)!
    const { body } = await signIn(carla.email, carla.password)
    const res = await fetch(`${DOCS}/families/${FAMILY_ID}/items`, {
      headers: { Authorization: `Bearer ${body.idToken}` },
    })
    expect(res.status).toBe(403)
  })

  it('S-050 AC7: running the seed twice neither fails nor duplicates', async () => {
    await seedEmulators()
    const count = async () => [
      (await list('users')).length,
      (await list('families')).length,
      (await list(`families/${FAMILY_ID}/items`)).length,
      (await list(`families/${FAMILY_ID}/catalog`)).length,
      (await list(`families/${FAMILY_ID}/categories`)).length,
    ]
    const first = await count()
    await expect(seedEmulators()).resolves.toBeUndefined()
    expect(await count()).toEqual(first)
  })
})
