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

const fam = (p: string) => `families/${FAMILY_ID}/${p}`

export async function seedEmulators(ep: Endpoints = DEFAULT_ENDPOINTS): Promise<void> {
  const rest = new Rest(ep)
  const people: Who[] = []
  for (const account of TEST_ACCOUNTS) {
    const s = await rest.account(account.email, account.password, account.displayName)
    people.push({ account, s })
    // Profile exactly like the app's ensureUserProfile; created only once.
    if (!(await rest.get(s, `users/${s.uid}`))) {
      await rest.commit(s, [
        {
          path: `users/${s.uid}`,
          create: true,
          data: {
            displayName: account.displayName,
            email: account.email,
            familyId: null,
            createdAt: SERVER_TIME,
          },
        },
      ])
    }
  }
  const owner = people.find((p) => p.account.key === 'ana')!
  const joiner = people.find((p) => p.account.key === 'beto')!

  const ownerProfile = await rest.get(owner.s, `users/${owner.s.uid}`)
  if (ownerProfile?.familyId?.stringValue == null) {
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
      { path: `users/${owner.s.uid}`, mask: ['familyId'], data: { familyId: FAMILY_ID } },
      {
        path: fam(`members/${owner.s.uid}`),
        create: true,
        data: { displayName: owner.account.displayName },
      },
      ...SEED_CATEGORIES.map((c) => ({
        path: fam(`categories/${c.id}`),
        create: true,
        data: { name: c.name, isDefault: true, order: c.order },
      })),
    ]
    await rest.commit(owner.s, writes)
  }

  const joinerProfile = await rest.get(joiner.s, `users/${joiner.s.uid}`)
  if (joinerProfile?.familyId?.stringValue == null) {
    await rest.commit(joiner.s, [
      {
        path: `families/${FAMILY_ID}`,
        mask: ['members', 'joinCode'],
        data: { members: [owner.s.uid, joiner.s.uid], joinCode: INVITE_CODE },
      },
      { path: `users/${joiner.s.uid}`, mask: ['familyId'], data: { familyId: FAMILY_ID } },
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
