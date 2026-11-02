import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { DISMISS_KEY } from '@/pwa/installHint'
import { initInstallPrompt } from '@/pwa/installPrompt'
import { InstallHint } from './InstallHint'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
const FIREFOX_ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0'

const useUa = (ua: string) => vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(ua)

beforeEach(() => {
  localStorage.clear()
  window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia
})
afterEach(() => vi.restoreAllMocks())

describe('S-080 AC4: InstallHint on iOS Safari', () => {
  it('shows pt-BR steps with inline svg and closes persistently', () => {
    useUa(IPHONE)
    const { container } = render(<InstallHint />)
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('Compartilhar')
    expect(note).toHaveTextContent('Adicionar à Tela de Início')
    expect(container.querySelector('svg')).not.toBeNull()
    const close = screen.getByRole('button', { name: /fechar/i })
    expect(close.className).toMatch(/min-h-12/)
    fireEvent.click(close)
    expect(localStorage.getItem(DISMISS_KEY)).not.toBeNull()
    expect(screen.queryByRole('note')).toBeNull()
  })
  it('renders nothing when already dismissed', () => {
    useUa(IPHONE)
    localStorage.setItem(DISMISS_KEY, '1')
    render(<InstallHint />)
    expect(screen.queryByRole('note')).toBeNull()
  })
  it('other iOS browsers are told to open Safari', () => {
    useUa(IPHONE.replace('Version/17.0', 'CriOS/120'))
    render(<InstallHint />)
    expect(screen.getByRole('note')).toHaveTextContent('Safari')
  })
})

describe('InstallHint on other platforms', () => {
  it('Firefox Android shows the menu steps', () => {
    useUa(FIREFOX_ANDROID)
    render(<InstallHint />)
    expect(screen.getByRole('note')).toHaveTextContent('Instalar')
    expect(screen.queryByRole('button', { name: 'Instalar' })).toBeNull()
  })

  it('Chromium appears with an Install button only after beforeinstallprompt, and triggers it', async () => {
    useUa(ANDROID_CHROME)
    initInstallPrompt()
    render(<InstallHint />)
    expect(screen.queryByRole('note')).toBeNull()
    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    act(() => void window.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(true)
    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Instalar' }))
    })
    expect(prompt).toHaveBeenCalledOnce()
    expect(screen.queryByRole('note')).toBeNull()
    expect(localStorage.getItem(DISMISS_KEY)).not.toBeNull()
  })
})
