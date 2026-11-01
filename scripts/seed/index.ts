// Idempotent emulator seed (S-050): 3 accounts, one family of two members with the 6 default
// categories, items (pending + bought), recurring catalog entries and member profiles.
// Every write is made with the owner's ID token, so firestore.rules validate the seed itself.
import { TEST_ACCOUNTS, type TestAccount } from './accounts.ts'
import {
  FAMILY_ID,
  FAMILY_NAME,
  INVITE_CODE,
  SEED_CATALOG,
  SEED_CATEGORIES,
  SEED_ITEMS,
} from './data.ts'
import {
  Rest,
  SERVER_TIME,
  DEFAULT_ENDPOINTS,
  type Endpoints,
  type Session,
  type Write,
} from './rest.ts'

type Who = { account: TestAccount; s: Session }

// Seed profiles are created with an empty ledger (ADR-0024); "has a group" = non-empty groupIds.
const hasGroups = (p: Awaited<ReturnType<Rest['get']>>) =>
  ((p?.groupIds as { arrayValue?: { values?: unknown[] } } | undefined)?.arrayValue?.values
    ?.length ?? 0) > 0

const fam = (p: string) => `families/${FAMILY_ID}/${p}`

export async function seedEmulators(ep: Endpoints = DEFAULT_ENDPOINTS): Promise<void> {
  const rest = new Rest(ep)
  const people: Who[] = []
  for (const account of TEST_ACCOUNTS) {
    const s = await rest.account(account.email, account.password, account.displayName)
    people.push({ account, s })
    // Profile exactly like the app's ensureUserProfile; created only once. The legacy account
    // gets its old-style profile (familyId, no groupIds) below, via the emulator admin bypass.
    if (!account.legacyProfile && !(await rest.get(s, `users/${s.uid}`))) {
      await rest.commit(s, [
        {
          path: `users/${s.uid}`,
          create: true,
          data: {
            displayName: account.displayName,
            email: account.email,
            groupIds: [],
            createdAt: SERVER_TIME,
          },
        },
      ])
    }
  }
  const owner = people.find((p) => p.account.key === 'ana')!
  const joiner = people.find((p) => p.account.key === 'beto')!

  const ownerProfile = await rest.get(owner.s, `users/${owner.s.uid}`)
  if (!hasGroups(ownerProfile)) {
    const writes: Write[] = [
      {
        path: `families/${FAMILY_ID}`,
        create: true,
        data: {
          name: FAMILY_NAME,
          members: [owner.s.uid],
          ownerId: owner.s.uid,
          inviteCode: INVITE_CODE,
          createdAt: SERVER_TIME,
        },
      },
      {
        path: `invites/${INVITE_CODE}`,
        create: true,
        data: {
          familyId: FAMILY_ID,
          familyName: FAMILY_NAME,
          createdBy: owner.s.uid,
          createdAt: SERVER_TIME,
        },
      },
      { path: `users/${owner.s.uid}`, mask: ['groupIds'], data: { groupIds: [FAMILY_ID] } },
      {
        path: fam(`members/${owner.s.uid}`),
        create: true,
        data: { displayName: owner.account.displayName },
      },
    ]
    await rest.commit(owner.s, writes)
    // Legacy defaults (isDefault true) can no longer be created by clients (S-092): only the emulator
    // admin token writes them, so dev:local keeps a legacy group to exercise the locked-defaults path.
    await rest.commit(
      { uid: owner.s.uid, token: 'owner' },
      SEED_CATEGORIES.map((c) => ({
        path: fam(`categories/${c.id}`),
        create: true,
        data: { name: c.name, isDefault: true, order: c.order },
      })),
    )
  }

  // Legacy profile: only the emulator admin token can write the old shape (rules deny `familyId` on create).
  const joinerProfile = await rest.get(joiner.s, `users/${joiner.s.uid}`)
  if (!joinerProfile) {
    await rest.commit({ uid: joiner.s.uid, token: 'owner' }, [
      {
        path: `families/${FAMILY_ID}`,
        mask: ['members', 'joinCode'],
        data: { members: [owner.s.uid, joiner.s.uid], joinCode: INVITE_CODE },
      },
      {
        path: `users/${joiner.s.uid}`,
        create: true,
        data: {
          displayName: joiner.account.displayName,
          email: joiner.account.email,
          familyId: FAMILY_ID,
          createdAt: SERVER_TIME,
        },
      },
      {
        path: fam(`members/${joiner.s.uid}`),
        create: true,
        data: { displayName: joiner.account.displayName },
      },
    ])
  }

  if (!(await rest.hasDocs(owner.s, fam('items')))) {
    await rest.commit(owner.s, [
      ...SEED_ITEMS.map((i) => ({
        path: fam(`items/${i.id}`),
        create: true,
        data: {
          name: i.name,
          nameKey: i.nameKey,
          quantity: i.quantity,
          unit: i.unit,
          note: i.note,
          categoryId: i.categoryId,
          recurring: i.recurring,
          status: 'pending',
          markedBy: null,
          markedAt: null,
          priceCents: null,
          createdBy: owner.s.uid,
          createdAt: SERVER_TIME,
        },
      })),
      ...SEED_CATALOG.map((c) => ({
        path: fam(`catalog/${c.nameKey}`),
        create: true,
        data: {
          name: c.name,
          nameKey: c.nameKey,
          quantity: c.quantity,
          unit: c.unit,
          categoryId: c.categoryId,
          ...(c.recurring === undefined ? {} : { recurring: c.recurring }),
          lastUsedAt: SERVER_TIME,
        },
      })),
    ])
    for (const who of [owner, joiner]) {
      const mine = SEED_ITEMS.filter((i) => i.boughtBy === who.account.key)
      if (!mine.length) continue
      await rest.commit(
        who.s,
        mine.map((i) => ({
          path: fam(`items/${i.id}`),
          mask: ['status', 'markedBy', 'priceCents'],
          data: {
            status: 'bought',
            markedBy: who.s.uid,
            markedAt: SERVER_TIME,
            priceCents: i.priceCents ?? null,
          },
        })),
      )
    }
  }
}
