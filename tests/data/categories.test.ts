import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '@/data/firebase'
import type { Category } from '@/data/converters'
import { addCategory, deleteCategory, renameCategory, watchCategories } from '@/data/categories'
import { joinFamilyByCode } from '@/data/families'
import { ensureUserProfile } from '@/data/users'
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

describe('S-092 AC2: no seed', () => {
  it('S-092 AC2: createFamily writes no category and watchCategories delivers an empty list', async () => {
    const { familyId } = await setup()
    expect(await watch(familyId)).toEqual([])
    const snap = await getDocs(collection(db, 'families', familyId, 'categories'))
    expect(snap.size).toBe(0)
  })
})

describe('S-037 AC2: CRUD', () => {
  it('S-037 AC2: add, rename and delete are void and reach the server', async () => {
    const { familyId } = await setup()
    const r = addCategory(familyId, '  Pets  ', [])
    expect(r).toBeUndefined()
    await flush()
    const all = await watch(familyId, (l) => l.length === 1)
    const pets = all[0]
    expect(pets).toMatchObject({ name: 'Pets', isDefault: false, order: 0 })
    addCategory(familyId, 'Mercearia', all) // suggestion tap (S-092 AC4): order = highest + 1
    await flush()
    expect((await watch(familyId, (l) => l.length === 2)).at(-1)).toMatchObject({
      name: 'Mercearia',
      isDefault: false,
      order: 1,
    })

    expect(renameCategory(familyId, pets.id, '  Animais ')).toBeUndefined()
    await flush()
    expect((await catDoc(familyId, pets.id))?.name).toBe('Animais')

    expect(deleteCategory(familyId, pets.id)).toBeUndefined()
    await flush()
    expect(await catDoc(familyId, pets.id)).toBeUndefined()
  })

  it('S-037 AC2: an empty or blank name is refused on the client', async () => {
    const { familyId } = await setup()
    addCategory(familyId, 'Pets', [])
    await flush()
    const [pets] = await watch(familyId, (l) => l.length === 1)
    addCategory(familyId, '   ', [])
    renameCategory(familyId, pets.id, '  ')
    await flush()
    const snap = await getDocs(collection(db, 'families', familyId, 'categories'))
    expect(snap.size).toBe(1)
    expect((await catDoc(familyId, pets.id))?.name).toBe('Pets')
  })
})

describe('S-037 AC3: join does not seed (still none after S-092)', () => {
  it('S-037 AC3: joinFamilyByCode adds no categories', async () => {
    const { familyId } = await setup('ana')
    const { inviteCode } = await createFamilyInfo(familyId)
    await logout()
    const bia = await loginAs('bia')
    await ensureUserProfile(bia)
    await joinFamilyByCode(inviteCode)
    await flush()
    const snap = await getDocs(collection(db, 'families', familyId, 'categories'))
    expect(snap.size).toBe(0)
  })
})

async function createFamilyInfo(familyId: string) {
  const fam = (await getDoc(doc(db, 'families', familyId))).data()
  return { inviteCode: fam?.inviteCode as string }
}
