import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { FamilyScreen } from './FamilyScreen'
import { strings } from '@/strings/pt-BR'

vi.mock('@/data/auth', () => ({ signOut: vi.fn() }))
vi.mock('@/data/families', () => ({
  MAX_GROUPS_PER_USER: 10,
  createFamily: vi.fn(),
  setRecurringEnabled: vi.fn(),
  joinFamilyByCode: vi.fn(),
  InviteNotFound: class extends Error {},
  AlreadyMember: class extends Error {},
  GroupLimitReached: class extends Error {},
}))
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => true }))
vi.mock('@/hooks/useMemberNames', () => ({ useMemberNames: () => undefined }))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ status: 'none', groups: [], setActiveGroup: vi.fn() }),
}))

describe('S-109 AC1: create/join screen presentation', () => {
  it('shows the intro text above the forms, without mentioning Não pode faltar', () => {
    render(
      <MemoryRouter>
        <FamilyScreen />
      </MemoryRouter>,
    )
    const intro = screen.getByText(strings.landing.heroSubtitle)
    expect(intro).toBeInTheDocument()
    expect(intro.textContent).not.toMatch(/não pode faltar/i)
    expect(intro.textContent).toMatch(/sem internet/i)
  })
})
