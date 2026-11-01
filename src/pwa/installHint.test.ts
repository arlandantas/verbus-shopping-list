import {
  dismissHint,
  DISMISS_KEY,
  isIosSafariBrowser,
  isStandalone,
  shouldShowIosInstallHint,
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

describe('S-080 AC3: shouldShowIosInstallHint', () => {
  it('shows only on iOS Safari, not standalone, not dismissed', () => {
    const s = mem()
    expect(shouldShowIosInstallHint(win(false, false), s)).toBe(true)
    expect(shouldShowIosInstallHint(win(true), s)).toBe(false)
    expect(shouldShowIosInstallHint(win(false, false, 'Android Chrome'), s)).toBe(false)
    dismissHint(s)
    expect(s.getItem(DISMISS_KEY)).not.toBeNull()
    expect(shouldShowIosInstallHint(win(false, false), s)).toBe(false)
  })
  it('unavailable or throwing storage does not break', () => {
    expect(shouldShowIosInstallHint(win(false, false), null)).toBe(true)
    const bad = {
      getItem: () => {
        throw new Error('x')
      },
      setItem: () => {
        throw new Error('x')
      },
    } as unknown as Storage
    expect(shouldShowIosInstallHint(win(false, false), bad)).toBe(true)
    expect(() => dismissHint(bad)).not.toThrow()
  })
})
