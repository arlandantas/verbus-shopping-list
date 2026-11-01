import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth'
import { auth } from '@/data/firebase'
import { devStrings, strings } from '@/strings/pt-BR'
import { ensureUserProfile, type AuthUser } from './users'

export type { AuthUser }

/** Maps a Firebase `auth/*` error to a pt-BR message; never leaks Firebase's English text. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code
  // Dev-only hint (literal env check so production builds drop devStrings): Vite without emulators.
  if (import.meta.env.VITE_USE_EMULATOR === 'true' && code === 'auth/network-request-failed') {
    return devStrings.emulatorNotFound
  }
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

/** Codes meaning the restored session can never work again (deleted/disabled/revoked account, wiped emulator). */
const DEAD_SESSION_CODES = new Set([
  'auth/invalid-refresh-token',
  'auth/user-token-expired',
  'auth/invalid-user-token',
  'auth/user-not-found',
  'auth/user-disabled',
  'auth/id-token-revoked',
])

const VALIDATE_TIMEOUT_MS = 6000

/**
 * Checks that a session restored from IndexedDB can still get a token. Only definitive auth errors
 * invalidate it; offline (network-request-failed), timeouts and unknown errors keep the cached
 * session so offline use works (ADR-0004).
 */
export async function isSessionDead(
  user: Pick<User, 'getIdToken'>,
  timeoutMs = VALIDATE_TIMEOUT_MS,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), timeoutMs)
  })
  try {
    await Promise.race([user.getIdToken(true), timeout])
    return false
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code
    return typeof code === 'string' && DEAD_SESSION_CODES.has(code)
  } finally {
    clearTimeout(timer)
  }
}

/** Resolves after `ms` so a hanging profile read can't hold the app on the loading screen. */
function giveUpAfter(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Reports the current user (null when signed out). A restored session is validated first and
 * signed out when dead. The `users/{uid}` profile is ensured before a user is reported, so screens
 * can rely on it existing. Profile errors/hangs (e.g. offline) don't block.
 */
export function watchAuth(cb: (user: AuthUser | null) => void): Unsubscribe {
  let seq = 0
  return onAuthStateChanged(auth, (user) => {
    const mine = ++seq
    if (!user) return cb(null)
    const info: AuthUser = { uid: user.uid, displayName: user.displayName, email: user.email }
    void (async () => {
      if (await isSessionDead(user)) {
        await fbSignOut(auth).catch(() => undefined)
        if (mine === seq) cb(null)
        return
      }
      await Promise.race([ensureUserProfile(info).catch(() => undefined), giveUpAfter(8000)])
      if (mine === seq) cb(info)
    })()
  })
}
