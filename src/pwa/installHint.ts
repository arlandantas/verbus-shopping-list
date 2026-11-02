// Key kept from the iOS-only hint (S-080) so earlier dismissals still count.
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

export type InstallPlatform =
  'ios-safari' | 'ios-other' | 'mac-safari' | 'android-firefox' | 'chromium' | 'other'

/** Which install instructions apply. 'chromium' installs through `beforeinstallprompt`; 'other' has no PWA install. */
export function detectInstallPlatform(nav: Nav): InstallPlatform {
  const ua = nav.userAgent
  if (isIosSafariBrowser(nav)) return 'ios-safari'
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1))
    return 'ios-other'
  if (/Android/.test(ua) && /Firefox\//.test(ua)) return 'android-firefox'
  if (/Chrome\/|Chromium\/|Edg\/|EdgA\/|OPR\/|SamsungBrowser\//.test(ua)) return 'chromium'
  if (/Macintosh/.test(ua) && /Version\/[\d.]+ Safari\//.test(ua)) return 'mac-safari'
  return 'other'
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

/** True when the platform has install steps (or can prompt) and the app is not already installed or dismissed. */
export function shouldShowInstallHint(
  win: Win,
  canPrompt: boolean,
  store: Storage | null = storage(),
): boolean {
  if (isStandalone(win) || isHintDismissed(store)) return false
  const platform = detectInstallPlatform(win.navigator)
  return platform === 'chromium' ? canPrompt : platform !== 'other'
}
