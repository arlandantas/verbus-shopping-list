import {
  dismissHint,
  DISMISS_KEY,
  isIosSafariBrowser,
  detectInstallPlatform,
  isStandalone,
  shouldShowInstallHint,
} from './installHint'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
const nav = (userAgent: string, maxTouchPoints = 0) => ({ userAgent, maxTouchPoints })

describe('S-080 AC1: isIosSafariBrowser', () => {
  it('true for iPhone Safari and iPadOS', () => {
    expect(isIosSafariBrowser(nav(IPHONE))).toBe(true)
    expect(isIosSafariBrowser(nav(MAC, 5))).toBe(true)
  })
  it('false for others', () => {
    const uas = [
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
      IPHONE.replace('Version/17.0', 'CriOS/120').replace(' Safari/604.1', ' Safari/604.1'),
      IPHONE.replace('Version/17.0', 'FxiOS/120'),
      IPHONE.replace('Version/17.0', 'EdgiOS/120'),
      IPHONE.replace(' Safari/604.1', ''),
    ]
    for (const ua of uas) expect(isIosSafariBrowser(nav(ua))).toBe(false)
    expect(isIosSafariBrowser(nav(MAC, 0))).toBe(false)
  })
})

const win = (standalone?: boolean, mm?: boolean, ua = IPHONE) => ({
  navigator: { userAgent: ua, maxTouchPoints: 5, standalone } as Navigator & {
    standalone?: boolean
  },
  matchMedia: mm === undefined ? undefined : () => ({ matches: mm }),
})
const mem = (): Storage => {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
  } as Storage
}

describe('S-080 AC2: isStandalone', () => {
  it('navigator.standalone or display-mode', () => {
    expect(isStandalone(win(true))).toBe(true)
    expect(isStandalone(win(false, true))).toBe(true)
    expect(isStandalone(win(false, false))).toBe(false)
    expect(isStandalone(win())).toBe(false)
  })
})

describe('S-080 AC3: shouldShowInstallHint (iOS Safari)', () => {
  it('shows only on iOS Safari, not standalone, not dismissed', () => {
    const s = mem()
    expect(shouldShowInstallHint(win(false, false), false, s)).toBe(true)
    expect(shouldShowInstallHint(win(true), false, s)).toBe(false)
    expect(shouldShowInstallHint(win(false, false, 'Android Chrome'), false, s)).toBe(false)
    dismissHint(s)
    expect(s.getItem(DISMISS_KEY)).not.toBeNull()
    expect(shouldShowInstallHint(win(false, false), false, s)).toBe(false)
  })
  it('unavailable or throwing storage does not break', () => {
    expect(shouldShowInstallHint(win(false, false), false, null)).toBe(true)
    const bad = {
      getItem: () => {
        throw new Error('x')
      },
      setItem: () => {
        throw new Error('x')
      },
    } as unknown as Storage
    expect(shouldShowInstallHint(win(false, false), false, bad)).toBe(true)
    expect(() => dismissHint(bad)).not.toThrow()
  })
})

const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
const DESKTOP_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
const EDGE = DESKTOP_CHROME + ' Edg/120.0'
const FIREFOX_ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0'
const FIREFOX_DESKTOP = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'

describe('detectInstallPlatform', () => {
  it('maps user agents to install instructions', () => {
    expect(detectInstallPlatform(nav(IPHONE))).toBe('ios-safari')
    expect(detectInstallPlatform(nav(IPHONE.replace('Version/17.0', 'CriOS/120')))).toBe(
      'ios-other',
    )
    expect(detectInstallPlatform(nav(IPHONE.replace(' Safari/604.1', '')))).toBe('ios-other')
    expect(detectInstallPlatform(nav(MAC, 5))).toBe('ios-safari')
    expect(detectInstallPlatform(nav(MAC, 0))).toBe('mac-safari')
    expect(detectInstallPlatform(nav(ANDROID_CHROME, 5))).toBe('chromium')
    expect(detectInstallPlatform(nav(DESKTOP_CHROME))).toBe('chromium')
    expect(detectInstallPlatform(nav(EDGE))).toBe('chromium')
    expect(detectInstallPlatform(nav(FIREFOX_ANDROID, 5))).toBe('android-firefox')
    expect(detectInstallPlatform(nav(FIREFOX_DESKTOP))).toBe('other')
  })
})

describe('shouldShowInstallHint on other platforms', () => {
  const on = (ua: string, canPrompt: boolean) =>
    shouldShowInstallHint(win(false, false, ua), canPrompt, mem())
  it('Chromium shows only once the browser offers the install prompt', () => {
    expect(on(ANDROID_CHROME, false)).toBe(false)
    expect(on(ANDROID_CHROME, true)).toBe(true)
    expect(on(DESKTOP_CHROME, true)).toBe(true)
  })
  it('manual platforms show steps; Firefox desktop never shows', () => {
    expect(on(FIREFOX_ANDROID, false)).toBe(true)
    const mac = { navigator: { userAgent: MAC, maxTouchPoints: 0 } as Navigator }
    expect(shouldShowInstallHint(mac, false, mem())).toBe(true)
    expect(on(FIREFOX_DESKTOP, true)).toBe(false)
  })
  it('installed (standalone) never shows', () => {
    expect(shouldShowInstallHint(win(true, undefined, ANDROID_CHROME), true, mem())).toBe(false)
  })
})
