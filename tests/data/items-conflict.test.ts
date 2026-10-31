import { deleteApp, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  getDocFromServer,
  connectFirestoreEmulator,
  getFirestore,
  updateDoc,
  disableNetwork,
  doc,
  enableNetwork,
  waitForPendingWrites,
} from 'firebase/firestore'
import { db } from '@/data/firebase'
import { addItem, setItemStatus } from '@/data/items'
import { clearFirestore, logout } from './support'
import { flush, setup } from './itemsSupport'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

describe('S-030 AC5: concurrent offline writes converge, last to reach the server wins', () => {
  it('both clients write status offline, reconnect one after the other; both end on the last write', async () => {
    const { familyId } = await setup()
    const id = addItem(familyId, { name: 'Arroz', quantity: 3, unit: 'kg' })
    await flush()

    // Second client: separate app instance, same account, own connection to the emulators.
    const appB = initializeApp({ apiKey: 'demo-api-key', projectId: 'demo-verbus' }, 'client-b')
    const authB = getAuth(appB)
    connectAuthEmulator(authB, 'http://127.0.0.1:9099', { disableWarnings: true })
    const dbB = getFirestore(appB)
    connectFirestoreEmulator(dbB, '127.0.0.1', 8080)
    await signInWithEmailAndPassword(authB, 'ana@example.test', 'test-password-123')
    const refB = doc(dbB, 'families', familyId, 'items', id)

    // Both clients go offline and write conflicting status values concurrently.
    await Promise.all([disableNetwork(db), disableNetwork(dbB)])
    setItemStatus(familyId, id, 'bought')
    void updateDoc(refB, { status: 'pending', markedBy: null, markedAt: null })

    // A reaches the server first, then B: B's write is the last one and wins.
    await enableNetwork(db)
    await waitForPendingWrites(db)
    await enableNetwork(dbB)
    await waitForPendingWrites(dbB)

    const expected = {
      status: 'pending',
      markedBy: null,
      markedAt: null,
      name: 'Arroz',
      quantity: 3,
      unit: 'kg',
    }
    expect(
      (await getDocFromServer(doc(db, 'families', familyId, 'items', id))).data(),
    ).toMatchObject(expected)
    expect((await getDocFromServer(refB)).data()).toMatchObject(expected)
    await deleteApp(appB)
  })
})
