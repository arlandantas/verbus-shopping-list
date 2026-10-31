import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '@/data/firebase'
import type { Category } from '@/data/converters'
import { addCategory, deleteCategory, renameCategory, watchCategories } from '@/data/categories'
import { joinFamilyByCode } from '@/data/families'
import { ensureUserProfile } from '@/data/users'
import { DEFAULT_CATEGORIES } from '@/domain/categories'
import { clearFirestore, loginAs, logout } from './support'
import { flush, next, setup } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

const watch = (f: string, pred?: (v: Category[]) => boolean) =>
  next<Category[]>((cb, err) => watchCategories(f, cb, err), pred)
const catDoc = async (f: string, id: string) =>
  (await getDoc(doc(db, 'families', f, 'categories', id))).data()

describe('S-037 AC1: seed', () => {
  it('S-037 AC1: createFamily writes the 6 defaults and watchCategories delivers them in order', async () => {
    const { familyId } = await setup()
    const list = await watch(familyId, (l) => l.length === 6)
    expect(list.map((c) => c.id)).toEqual(DEFAULT_CATEGORIES.map((c) => c.id))
    expect(list.every((c) => c.isDefault)).toBe(true)
    expect(list.map((c) => c.name)).toEqual(DEFAULT_CATEGORIES.map((c) => c.name))
  })
})

describe('S-037 AC2: CRUD', () => {
  it('S-037 AC2: add, rename and delete are void and reach the server', async () => {
    const { familyId } = await setup()
    const defaults = await watch(familyId, (l) => l.length === 6)
    const r = addCategory(familyId, '  Pets  ', defaults)
    expect(r).toBeUndefined()
    await flush()
    const all = await watch(familyId, (l) => l.length === 7)
    const pets = all.at(-1)!
    expect(pets).toMatchObject({ name: 'Pets', isDefault: false, order: 6 })

    expect(renameCategory(familyId, pets.id, '  Animais ')).toBeUndefined()
    await flush()
    expect((await catDoc(familyId, pets.id))?.name).toBe('Animais')

    expect(deleteCategory(familyId, pets.id)).toBeUndefined()
    await flush()
    expect(await catDoc(familyId, pets.id)).toBeUndefined()
  })

  it('S-037 AC2: an empty or blank name is refused on the client', async () => {
    const { familyId } = await setup()
    await watch(familyId, (l) => l.length === 6)
    addCategory(familyId, '   ', [])
    renameCategory(familyId, 'mercearia', '  ')
    await flush()
    const snap = await getDocs(collection(db, 'families', familyId, 'categories'))
    expect(snap.size).toBe(6)
    expect((await catDoc(familyId, 'mercearia'))?.name).toBe('Mercearia')
  })
})

describe('S-037 AC3: join does not seed', () => {
  it('S-037 AC3: joinFamilyByCode leaves the 6 defaults untouched', async () => {
    const { familyId } = await setup('ana')
    const { inviteCode } = await createFamilyInfo(familyId)
    await logout()
    const bia = await loginAs('bia')
    await ensureUserProfile(bia)
    await joinFamilyByCode(inviteCode)
    await flush()
    const snap = await getDocs(collection(db, 'families', familyId, 'categories'))
    expect(snap.size).toBe(6)
  })
})

async function createFamilyInfo(familyId: string) {
  const fam = (await getDoc(doc(db, 'families', familyId))).data()
  return { inviteCode: fam?.inviteCode as string }
}
