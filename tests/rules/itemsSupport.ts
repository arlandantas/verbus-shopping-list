import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, serverTimestamp } from 'firebase/firestore'
import { asUser, seed, setupEnv } from './support'

export const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'pct', 'cx', 'dz']

export const seedItem = (over: Record<string, unknown> = {}) => ({
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
  createdAt: new Date(),
  ...over,
})

export const newItem = (over: Record<string, unknown> = {}) => ({
  ...seedItem(),
  createdAt: serverTimestamp(),
  ...over,
})

/** Items rules env: F1 (alice, dave) with items x (pending) and bought; F2 (bob). */
export const setupItemsEnv = (projectId: string) => setupEnv(projectId)

export async function seedItems(env: RulesTestEnvironment): Promise<void> {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': {
      name: 'Casa',
      members: ['alice', 'dave'],
      ownerId: 'alice',
      createdAt: new Date(),
    },
    'families/F1/items/x': seedItem(),
    'families/F1/items/bought': seedItem({
      status: 'bought',
      markedBy: 'alice',
      markedAt: new Date(),
    }),
    'families/F1/items/pricedBought': seedItem({
      status: 'bought',
      markedBy: 'alice',
      markedAt: new Date(),
      priceCents: 1290,
    }),
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    'families/F2/items/y': seedItem({ createdBy: 'bob' }),
  })
}

export const alice = (env: RulesTestEnvironment) => asUser(env, 'alice')
export const itemRef = (db: ReturnType<typeof alice>, id = 'x') =>
  doc(db, `families/F1/items/${id}`)
