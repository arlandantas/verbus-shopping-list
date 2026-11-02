/** Where to go once the welcome steps end or are skipped. S-111 hooks the item-suggestion screen here. */
export const WELCOME_NEXT = '/'

/** Route that shows the welcome steps; navigate here after creating or joining a group (ADR-0029). */
export const WELCOME_ROUTE = '/boas-vindas'

const key = (uid: string, groupId: string) => `welcomeSeen:${uid}:${groupId}`

export function hasSeenWelcome(uid: string, groupId: string): boolean {
  try {
    return localStorage.getItem(key(uid, groupId)) !== null
  } catch {
    return false
  }
}

export function markWelcomeSeen(uid: string, groupId: string): void {
  try {
    localStorage.setItem(key(uid, groupId), '1')
  } catch {
    // storage unavailable: the welcome may show again
  }
}

let pending = false
/** Set right before creating/joining a group: the screen remounts when the group flips, so a flag survives where navigate() would not. */
export function requestWelcome(): void {
  pending = true
}
export function cancelWelcome(): void {
  pending = false
}
export function isWelcomePending(): boolean {
  return pending
}
