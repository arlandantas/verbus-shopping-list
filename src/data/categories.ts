import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/data/firebase'
import { MAX_CATEGORY_ORDER, nextCategoryOrder } from '@/domain/categories'
import { categoryConverter, type Category } from './converters'
import { fireAndForget } from './writeErrors'

const categoriesCol = (familyId: string) => collection(db, 'families', familyId, 'categories')
const categoryRef = (familyId: string, id: string) =>
  doc(db, 'families', familyId, 'categories', id)

/** Live categories ordered by (order, name), as groupByCategory expects. */
export function watchCategories(
  familyId: string,
  cb: (categories: Category[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const ref = categoriesCol(familyId).withConverter(categoryConverter)
  return onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snap) =>
      cb(
        snap.docs
          .map((d) => d.data())
          .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-BR')),
      ),
    onError,
  )
}

/** Not awaited (ADR-0004). Blank names are ignored; order = highest + 1. */
export function addCategory(
  familyId: string,
  name: string,
  categories: readonly { order: number }[],
): void {
  const clean = name.trim()
  if (!clean) return
  fireAndForget(
    setDoc(doc(categoriesCol(familyId)), {
      name: clean,
      isDefault: false,
      order: nextCategoryOrder(categories),
    }),
  )
}

export function renameCategory(familyId: string, id: string, name: string): void {
  const clean = name.trim()
  if (!clean) return
  fireAndForget(updateDoc(categoryRef(familyId, id), { name: clean }))
}

export function deleteCategory(familyId: string, id: string): void {
  fireAndForget(deleteDoc(categoryRef(familyId, id)))
}

/** Many categories in one un-awaited batch (S-111); order continues after `existing`. Returns the new ids. */
export function addCategories(
  familyId: string,
  names: readonly string[],
  existing: readonly { order: number }[],
): string[] {
  if (names.length === 0) return []
  const batch = writeBatch(db)
  const start = nextCategoryOrder(existing)
  const ids = names.map((name, i) => {
    const ref = doc(categoriesCol(familyId))
    batch.set(ref, {
      name: name.trim(),
      isDefault: false,
      order: Math.min(start + i, MAX_CATEGORY_ORDER),
    })
    return ref.id
  })
  fireAndForget(batch.commit())
  return ids
}
