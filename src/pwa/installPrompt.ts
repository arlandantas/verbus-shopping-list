// Chromium fires `beforeinstallprompt` once, early; keep the event so the hint can trigger it later.
type PromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: PromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export function initInstallPrompt(win: Window = window): void {
  win.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as PromptEvent
    notify()
  })
  win.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export function subscribeInstallPrompt(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const canPromptInstall = (): boolean => deferred !== null

/** Opens the browser install dialog; true when the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred
  if (!e) return false
  deferred = null
  notify()
  await e.prompt()
  return (await e.userChoice).outcome === 'accepted'
}
