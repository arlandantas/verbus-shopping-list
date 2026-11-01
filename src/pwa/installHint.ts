export const DISMISS_KEY = 'verbus.iosInstallHint.dismissed'

type Nav = Pick<Navigator, 'userAgent' | 'maxTouchPoints'>
type Win = {
  navigator: Navigator & { standalone?: boolean }
  matchMedia?: (q: string) => { matches: boolean }
}

/** True for Safari on iPhone/iPad (incl. iPadOS posing as Macintosh); false for other iOS browsers and webviews. */
export function isIosSafariBrowser(nav: Nav): boolean {
  const ua = nav.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1)
  if (!ios) return false
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return false
  return /Safari\//.test(ua)
}

export function isStandalone(win: Win): boolean {
  if (win.navigator.standalone === true) return true
  return win.matchMedia?.('(display-mode: standalone)').matches === true
}

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function isHintDismissed(store: Storage | null = storage()): boolean {
  try {
    return store?.getItem(DISMISS_KEY) != null
  } catch {
    return false
  }
}

export function dismissHint(store: Storage | null = storage()): void {
  try {
    store?.setItem(DISMISS_KEY, '1')
  } catch {
    // storage unavailable: hide for this session only
  }
}

export function shouldShowIosInstallHint(win: Win, store: Storage | null = storage()): boolean {
  return isIosSafariBrowser(win.navigator) && !isStandalone(win) && !isHintDismissed(store)
}
