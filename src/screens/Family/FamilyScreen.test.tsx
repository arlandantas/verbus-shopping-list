import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { FamilyScreen } from './FamilyScreen'
import { strings } from '@/strings/pt-BR'

const h = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('@/data/auth', () => ({ signOut: h.signOut }))
vi.mock('@/data/families', () => ({
  createFamily: vi.fn(),
  joinFamilyByCode: vi.fn(),
  InviteNotFound: class extends Error {},
  AlreadyInFamily: class extends Error {},
}))
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => true }))
vi.mock('@/hooks/useMemberNames', () => ({ useMemberNames: () => ({ u1: 'Ana' }) }))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({
    status: 'ready',
    family: { id: 'f1', name: 'Casa', inviteCode: 'ABC123', members: ['u1', 'u2'] },
  }),
}))

function renderIt() {
  return render(
    <MemoryRouter initialEntries={['/familia']}>
      <Routes>
        <Route path="/familia" element={<FamilyScreen />} />
        <Route path="/categorias" element={<p>cats page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FamilyScreen (S-064 AC3)', () => {
  it('top bar shows the family name and a logout icon button', () => {
    renderIt()
    expect(screen.getByRole('heading', { name: 'Casa', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.login.signOut }))
    expect(h.signOut).toHaveBeenCalled()
  })

  it('invite card: highlighted code, copy icon button and tonal share button', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderIt()
    expect(screen.getByTestId('invite-code')).toHaveTextContent('ABC123')
    fireEvent.click(screen.getByRole('button', { name: strings.family.invite.copyCode }))
    expect(writeText).toHaveBeenCalledWith('ABC123')
    expect(screen.getByRole('button', { name: strings.family.invite.share })).toHaveClass(
      'm3-btn--tonal',
    )
  })

  it('shows an error message when the clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.family.invite.copyCode }))
    expect(await screen.findByText(strings.family.invite.copyFailed)).toBeInTheDocument()
  })

  it('lists members with names and a fallback', () => {
    renderIt()
    const list = screen.getByRole('list', { name: strings.family.membersSection })
    expect(within(list).getByText('Ana')).toBeInTheDocument()
    expect(within(list).getByText(strings.family.memberFallback)).toBeInTheDocument()
  })

  it('Categorias item navigates to /categorias', () => {
    renderIt()
    fireEvent.click(screen.getByRole('link', { name: strings.categories.link }))
    expect(screen.getByText('cats page')).toBeInTheDocument()
  })
})
