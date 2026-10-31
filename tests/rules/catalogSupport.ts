import { serverTimestamp } from 'firebase/firestore'
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { seed } from './support'

export const entry = (over: Record<string, unknown> = {}) => ({
  name: 'Leite',
  nameKey: 'leite',
  quantity: 1,
  unit: 'un',
  categoryId: null,
  lastUsedAt: serverTimestamp(),
  ...over,
})

/** Two families: F1 (alice, dave) with catalog/leite, F2 (bob) with catalog/arroz. */
export async function seedCatalogFamilies(env: RulesTestEnvironment) {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': {
      name: 'Casa',
      members: ['alice', 'dave'],
      ownerId: 'alice',
      createdAt: new Date(),
    },
    'families/F1/catalog/leite': { ...entry(), lastUsedAt: new Date() },
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    'families/F2/catalog/arroz': {
      ...entry({ name: 'Arroz', nameKey: 'arroz' }),
      lastUsedAt: new Date(),
    },
  })
}
