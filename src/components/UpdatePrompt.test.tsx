import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { UpdatePrompt } from './UpdatePrompt'

const hook = vi.hoisted(() => ({
  needRefresh: false,
  offlineReady: false,
  setNeed: vi.fn(),
  setOffline: vi.fn(),
  update: vi.fn(),
}))
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [hook.needRefresh, hook.setNeed],
    offlineReady: [hook.offlineReady, hook.setOffline],
    updateServiceWorker: hook.update,
  }),
}))

beforeEach(() => {
  hook.needRefresh = false
  hook.offlineReady = false
  vi.clearAllMocks()
})

describe('S-083: UpdatePrompt', () => {
  it('AC2: needRefresh shows snackbar; Atualizar calls updateServiceWorker(true)', () => {
    hook.needRefresh = true
    render(<UpdatePrompt />)
    expect(screen.getByText('Nova versão disponível')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    expect(hook.update).toHaveBeenCalledWith(true)
  })

  it('AC2: closing hides until next detection', () => {
    vi.useFakeTimers()
    hook.needRefresh = true
    render(<UpdatePrompt />)
    vi.advanceTimersByTime(15000)
    expect(hook.setNeed).toHaveBeenCalledWith(false)
    vi.useRealTimers()
  })

  it('AC3: offlineReady shows message once and clears itself', () => {
    vi.useFakeTimers()
    hook.offlineReady = true
    render(<UpdatePrompt />)
    expect(screen.getByText('Pronto para usar sem internet')).toBeInTheDocument()
    vi.advanceTimersByTime(4000)
    expect(hook.setOffline).toHaveBeenCalledWith(false)
    vi.useRealTimers()
  })

  it('AC5: sits above the add bar via --snackbar-offset', () => {
    hook.needRefresh = true
    const { container } = render(<UpdatePrompt />)
    expect((container.firstChild as HTMLElement).getAttribute('style')).toContain('--add-bar-zone')
  })

  it('renders nothing by default', () => {
    const { container } = render(<UpdatePrompt />)
    expect(container).toBeEmptyDOMElement()
  })
})
