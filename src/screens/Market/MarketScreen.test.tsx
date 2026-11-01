import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Item } from '@/data/converters'
import { strings } from '@/strings/pt-BR'
import { MarketScreen } from './MarketScreen'

const state = vi.hoisted(() => ({ items: [] as unknown[] }))
vi.mock('@/data/items', () => ({ toggleItemStatus: vi.fn() }))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'f1', name: 'Casa' } }),
}))
vi.mock('@/app/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
vi.mock('@/hooks/useMemberNames', () => ({ useMemberNames: () => ({}) }))
vi.mock('@/screens/List/useItems', () => ({ useItems: () => state.items }))
vi.mock('@/hooks/useCategories', () => ({ useCategories: () => [] }))

const item = (id: string, status: 'pending' | 'bought') =>
  ({ id, name: id, nameKey: id, status, quantity: 1, unit: 'un' }) as unknown as Item

const renderIt = () =>
  render(
    <MemoryRouter>
      <MarketScreen />
    </MemoryRouter>,
  )

describe('S-046 AC1: Finalizar compra on the market screen', () => {
  it('hidden without bought items', () => {
    state.items = [item('a', 'pending')]
    renderIt()
    expect(screen.queryByRole('link', { name: strings.checkout.link })).toBeNull()
  })

  it('shown, linking to /finalizar, with a bought item', () => {
    state.items = [item('a', 'bought'), item('b', 'pending')]
    renderIt()
    expect(screen.getByRole('link', { name: strings.checkout.link })).toHaveAttribute(
      'href',
      '/finalizar',
    )
  })
})
