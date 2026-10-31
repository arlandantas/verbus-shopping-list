import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from '@/app/routes'

const committedAtSave: boolean[] = []
vi.mock('react-router', async (orig) => ({
  ...(await orig<typeof import('react-router')>()),
  Navigate: () => <p>navigating</p>,
}))
vi.mock('@/app/returnTo', () => ({
  saveReturnTo: () => {
    committedAtSave.push(document.body.textContent === 'navigating')
  },
  peekReturnTo: () => null,
  clearReturnTo: vi.fn(),
}))
vi.mock('@/app/AuthProvider', () => ({ useAuth: () => ({ status: 'signedOut', user: null }) }))
vi.mock('@/data/auth', () => ({}))
vi.mock('@/data/families', () => ({}))
vi.mock('@/screens/Family/FamilyScreen', () => ({ FamilyScreen: () => null }))
vi.mock('@/screens/Item/ItemScreen', () => ({ ItemScreen: () => null }))
vi.mock('@/screens/List/ListScreen', () => ({ ListScreen: () => null }))
vi.mock('@/screens/Login/LoginScreen', () => ({ LoginScreen: () => null }))
vi.mock('@/screens/Invite/InviteScreen', () => ({ InviteScreen: () => null }))
vi.mock('@/app/FamilyProvider', () => ({ FamilyProvider: () => null, useFamily: vi.fn() }))

describe('AppRoutes', () => {
  it('saves the invite returnTo from an effect, once, then goes to login', () => {
    render(
      <MemoryRouter initialEntries={['/convite/ABCD2345']}>
        <AppRoutes />
      </MemoryRouter>,
    )
    expect(screen.getByText('navigating')).toBeInTheDocument()
    expect(committedAtSave.length).toBeGreaterThan(0)
    expect(committedAtSave.every(Boolean)).toBe(true) // ran after commit, not during render
  })
})
