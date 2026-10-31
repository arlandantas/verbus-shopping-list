import { doc, getDoc, waitForPendingWrites } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { createFamily } from '@/data/families'
import { ensureUserProfile } from '@/data/users'
import { loginAs } from './support'

export async function setup(name = 'ana') {
  const user = await loginAs(name)
  await ensureUserProfile(user)
  const { familyId } = await createFamily('Casa')
  return { user, familyId }
}

export const flush = () => waitForPendingWrites(db)
export const itemDoc = async (f: string, id: string) =>
  (await getDoc(doc(db, 'families', f, 'items', id))).data()
export const catDoc = async (f: string, key: string) =>
  (await getDoc(doc(db, 'families', f, 'catalog', key))).data()

export function next<T>(
  subscribe: (cb: (v: T) => void, onError: (e: unknown) => void) => () => void,
  pred: (v: T) => boolean = () => true,
) {
  return new Promise<T>((resolve, reject) => {
    const off = subscribe((v) => {
      if (pred(v)) {
        queueMicrotask(() => off())
        resolve(v)
      }
    }, reject)
  })
}

export const current = {
  name: 'Arroz',
  nameKey: 'arroz',
  quantity: 1,
  unit: 'un' as const,
  categoryId: null,
}
