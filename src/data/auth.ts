import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type Unsubscribe,
} from 'firebase/auth'
import { auth } from '@/data/firebase'
import { strings } from '@/strings/pt-BR'
import { ensureUserProfile, type AuthUser } from './users'

export type { AuthUser }

/** Maps a Firebase `auth/*` error to a pt-BR message; never leaks Firebase's English text. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code
  const table: Record<string, string> = strings.authErrors
  return (typeof code === 'string' && table[code]) || strings.authErrors.unknown
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  await createUserWithEmailAndPassword(auth, email, password)
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider())
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth)
}

/**
 * Reports the current user (null when signed out). The `users/{uid}` profile is ensured before a
 * user is reported, so screens can rely on it existing. Profile errors (e.g. offline) don't block.
 */
export function watchAuth(cb: (user: AuthUser | null) => void): Unsubscribe {
  let seq = 0
  return onAuthStateChanged(auth, (user) => {
    const mine = ++seq
    if (!user) return cb(null)
    const info: AuthUser = { uid: user.uid, displayName: user.displayName, email: user.email }
    void ensureUserProfile(info)
      .catch(() => undefined)
      .then(() => {
        if (mine === seq) cb(info)
      })
  })
}
