import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DISMISS_KEY } from '@/pwa/installHint'
import { IosInstallHint } from './IosInstallHint'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(IPHONE)
  window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia
})
afterEach(() => vi.restoreAllMocks())

describe('S-080 AC4: IosInstallHint', () => {
  it('shows pt-BR steps with inline svg and closes persistently', () => {
    const { container } = render(<IosInstallHint />)
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
    localStorage.setItem(DISMISS_KEY, '1')
    render(<IosInstallHint />)
    expect(screen.queryByRole('note')).toBeNull()
  })
})
