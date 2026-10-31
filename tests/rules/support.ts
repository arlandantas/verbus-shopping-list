import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import type { Firestore } from 'firebase/firestore'

export async function setupEnv(projectId: string): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
}

export function asUser(env: RulesTestEnvironment, uid: string): Firestore {
  return env.authenticatedContext(uid).firestore() as unknown as Firestore
}

export function anon(env: RulesTestEnvironment): Firestore {
  return env.unauthenticatedContext().firestore() as unknown as Firestore
}

/** Seeds documents bypassing rules. Keys are full document paths. */
export async function seed(
  env: RulesTestEnvironment,
  docs: Record<string, Record<string, unknown>>,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = ctx.firestore() as unknown as Firestore
    for (const [path, data] of Object.entries(docs)) await setDoc(doc(db, path), data)
  })
}

/** Valid `purchases` doc (ADR-0012); `purchasedAt` is the server time sentinel. */
export const newPurchase = async (over: Record<string, unknown> = {}) => {
  const { serverTimestamp } = await import('firebase/firestore')
  return {
    cycle: '2026-10',
    market: 'Mercado Bom',
    itemCount: 1,
    totalCents: 1290,
    createdBy: 'alice',
    purchasedAt: serverTimestamp(),
    ...over,
  }
}

/** Valid `purchaseLines` doc (ADR-0012). */
export const newPurchaseLine = async (over: Record<string, unknown> = {}) => {
  const { serverTimestamp } = await import('firebase/firestore')
  return {
    purchaseId: 'P1',
    cycle: '2026-10',
    name: 'Leite',
    nameKey: 'leite',
    quantity: 1,
    unit: 'un',
    categoryId: null,
    categoryName: null,
    priceCents: 1290,
    market: 'Mercado Bom',
    markedBy: 'alice',
    purchasedAt: serverTimestamp(),
    ...over,
  }
}
