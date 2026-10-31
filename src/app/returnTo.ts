// Where to go after login. Only invite paths are accepted (S-012), so a stored value can never
// become an open redirect. sessionStorage is wrapped: it can throw (private mode, blocked data).
const KEY = 'returnTo'
const INVITE_PATH = /^\/convite\/[A-Za-z0-9-]{1,32}$/

export function saveReturnTo(path: string): void {
  try {
    if (INVITE_PATH.test(path)) sessionStorage.setItem(KEY, path)
  } catch {
    // storage unavailable: the user lands on the default route after login
  }
}

export function peekReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(KEY)
    return value && INVITE_PATH.test(value) ? value : null
  } catch {
    return null
  }
}

export function clearReturnTo(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}
