// Aliased as `@/data/firebase` in the `data` Vitest project: same exports as src/data/firebase.ts,
// but a plain memory-cache Firestore pointed at the emulators (no IndexedDB/DOM in node).
import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const PROJECT_ID = 'demo-verbus'

export const app = initializeApp({ apiKey: 'demo-api-key', projectId: PROJECT_ID, appId: 'demo' })
export const auth = getAuth(app)
export const db = getFirestore(app)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
connectFirestoreEmulator(db, '127.0.0.1', 8080)

const PASSWORD = 'test-password-123'

/** Creates (or signs in) an email/password user in the Auth emulator and returns it. */
export async function loginAs(name: string) {
  const email = `${name}@example.test`
  try {
    return (await createUserWithEmailAndPassword(auth, email, PASSWORD)).user
  } catch {
    return (await signInWithEmailAndPassword(auth, email, PASSWORD)).user
  }
}

export const logout = () => signOut(auth)

export async function clearFirestore(): Promise<void> {
  await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
}
