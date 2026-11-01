import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from '@/app/routes'

const fam = vi.hoisted(() => ({ status: 'none' as string }))
vi.mock('@/app/AuthProvider', () => ({
  useAuth: () => ({ status: 'signedIn', user: { uid: 'u' } }),
}))
vi.mock('@/app/FamilyProvider', () => ({
  FamilyProvider: ({ children }: { children: React.ReactNode }) => children,
  useFamily: () => ({ status: fam.status, family: null }),
}))
vi.mock('@/data/auth', () => ({}))
vi.mock('@/data/families', () => ({}))
vi.mock('@/screens/Family/FamilyScreen', () => ({ FamilyScreen: () => <p>familia</p> }))
vi.mock('@/screens/Invite/InviteScreen', () => ({ InviteScreen: () => <p>convite</p> }))
vi.mock('@/screens/List/ListScreen', () => ({ ListScreen: () => <p>lista</p> }))
vi.mock('@/screens/Pantry/PantryScreen', () => ({ PantryScreen: () => null }))
vi.mock('@/screens/Market/MarketScreen', () => ({ MarketScreen: () => null }))
vi.mock('@/screens/Checkout/CheckoutScreen', () => ({ CheckoutScreen: () => null }))
vi.mock('@/screens/Categories/CategoriesScreen', () => ({ CategoriesScreen: () => null }))
vi.mock('@/screens/History/HistoryScreen', () => ({ HistoryScreen: () => null }))
vi.mock('@/screens/History/CycleScreen', () => ({ CycleScreen: () => null }))
vi.mock('@/screens/Login/LoginScreen', () => ({ LoginScreen: () => null }))

const nav = () => screen.queryByRole('navigation', { name: 'Principal' })

describe('AppRoutes shell', () => {
  it.each(['/familia', '/convite/ABCD2345', '/entrar'])(
    'S-053 AC2: no tabs without a ready family (%s)',
    (path) => {
      fam.status = 'none'
      render(
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>,
      )
      expect(nav()).toBeNull()
    },
  )

  it('S-053 AC1: tabs on /familia and / with a ready family', () => {
    fam.status = 'ready'
    for (const path of ['/familia', '/']) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>,
      )
      expect(nav()).toBeInTheDocument()
      unmount()
    }
  })

  it('S-053 AC2: invite link keeps no tabs even with a ready family', () => {
    fam.status = 'ready'
    render(
      <MemoryRouter initialEntries={['/convite/ABCD2345']}>
        <AppRoutes />
      </MemoryRouter>,
    )
    expect(screen.getByText('convite')).toBeInTheDocument()
    expect(nav()).toBeNull()
  })
})
