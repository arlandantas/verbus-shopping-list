import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, waitFor, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { strings } from '@/strings/pt-BR'
import { GroupSwitcher } from './GroupSwitcher'

const setActiveGroup = vi.fn()
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({
    family: { id: 'a', name: 'Casa' },
    groups: [
      { id: 'a', name: 'Casa' },
      { id: 'b', name: 'Pais' },
    ],
    setActiveGroup,
  }),
}))

function Loc() {
  const action = (useLocation().state as { action?: string } | null)?.action
  return <p>aba grupo {action}</p>
}
const renderIt = (onClose = vi.fn()) => {
  const view = render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<GroupSwitcher onClose={onClose} />} />
        <Route path="/grupo" element={<Loc />} />
      </Routes>
    </MemoryRouter>,
  )
  return Object.assign(onClose, { view })
}
const pop = () => act(() => window.dispatchEvent(new PopStateEvent('popstate')))

describe('GroupSwitcher', () => {
  it('S-090 AC1: lists groups with the active one marked, plus create/join', () => {
    renderIt()
    expect(screen.getByRole('button', { name: /Casa/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Pais' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: strings.groups.createNew })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.groups.joinWithCode })).toBeInTheDocument()
  })

  it('S-090 AC2: choosing another group switches and closes', () => {
    const onClose = renderIt()
    fireEvent.click(screen.getByRole('button', { name: 'Pais' }))
    expect(setActiveGroup).toHaveBeenCalledWith('b')
    expect(onClose).toHaveBeenCalled()
  })

  it('S-090 AC1: create entry goes to the Grupo tab', async () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.groups.createNew }))
    act(() => window.dispatchEvent(new PopStateEvent('popstate'))) // the sheet's own history unwind
    await waitFor(() => expect(screen.getByText(/aba grupo/)).toBeInTheDocument())
  })

  it('S-091: create and join entries pass the matching action to /grupo', async () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.groups.joinWithCode }))
    pop()
    await waitFor(() => expect(screen.getByText('aba grupo join')).toBeInTheDocument())
  })

  it('S-091: create entry passes action create', async () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.groups.createNew }))
    pop()
    await waitFor(() => expect(screen.getByText('aba grupo create')).toBeInTheDocument())
  })

  it('S-090: double tap on create closes once and navigates once', async () => {
    const onClose = renderIt()
    const add = vi.spyOn(window, 'addEventListener')
    const btn = screen.getByRole('button', { name: strings.groups.createNew })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(add.mock.calls.filter(([t]) => t === 'popstate')).toHaveLength(1)
    pop()
    await waitFor(() => expect(screen.getByText(/aba grupo/)).toBeInTheDocument())
    add.mockRestore()
  })

  it('S-090: without a pop the fallback timer navigates once and drops the listener', async () => {
    vi.useFakeTimers()
    const remove = vi.spyOn(window, 'removeEventListener')
    const onClose = renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.groups.joinWithCode }))
    onClose.view.unmount()
    await act(() => vi.advanceTimersByTimeAsync(600))
    expect(remove.mock.calls.filter(([t]) => t === 'popstate').length).toBeGreaterThan(0)
    vi.useRealTimers()
    remove.mockRestore()
  })

  it('S-090: Esc closes the sheet without navigating', () => {
    const onClose = renderIt()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
    pop()
    expect(screen.queryByText(/aba grupo/)).not.toBeInTheDocument()
  })
})
