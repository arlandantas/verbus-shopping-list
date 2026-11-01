import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Item } from '@/data/converters'
import { strings } from '@/strings/pt-BR'
import { CheckoutScreen } from './CheckoutScreen'

const h = vi.hoisted(() => ({
  checkout: vi.fn(),
  setItemPrice: vi.fn(),
  state: { items: null as unknown[] | null },
}))
vi.mock('@/data/items', () => ({ setItemPrice: h.setItemPrice }))
vi.mock('@/data/checkout', () => ({ checkout: h.checkout }))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'f1', name: 'Casa' } }),
}))
vi.mock('@/screens/List/useItems', () => ({ useItems: () => h.state.items }))
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => [{ id: 'c1', name: 'Mercearia' }],
}))
vi.mock('@/hooks/useHistory', () => ({
  usePurchases: () => [
    { market: 'Atacadão', purchasedAt: new Date(2), cycle: '2026-10', itemCount: 1 },
    { market: 'Feira', purchasedAt: new Date(1), cycle: '2026-10', itemCount: 1 },
  ],
}))

const item = (id: string, name: string, status: 'pending' | 'bought', priceCents = null): Item =>
  ({ id, name, nameKey: name, status, priceCents, categoryId: 'c1' }) as unknown as Item

const renderIt = () =>
  render(
    <MemoryRouter initialEntries={['/finalizar']}>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/finalizar" element={<CheckoutScreen />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  h.checkout.mockReset()
  h.setItemPrice.mockReset()
  h.state.items = [
    item('a', 'arroz', 'bought'),
    item('b', 'leite', 'bought'),
    item('c', 'pão', 'pending'),
  ]
})

describe('S-046 AC2: checkout screen', () => {
  it('lists only bought items with a price field each and the known markets', () => {
    renderIt()
    expect(screen.getByLabelText(strings.checkout.priceFor('arroz'))).toBeInTheDocument()
    expect(screen.getByLabelText(strings.checkout.priceFor('leite'))).toBeInTheDocument()
    expect(screen.queryByLabelText(strings.checkout.priceFor('pão'))).toBeNull()
    const market = screen.getByLabelText(strings.checkout.marketLabel)
    const list = document.getElementById(market.getAttribute('list')!)!
    expect([...list.querySelectorAll('option')].map((o) => o.getAttribute('value'))).toEqual([
      'Atacadão',
      'Feira',
    ])
  })

  it('saves the price with setItemPrice on blur', () => {
    renderIt()
    const input = screen.getByLabelText(strings.checkout.priceFor('arroz'))
    fireEvent.change(input, { target: { value: '5,00' } })
    expect(h.setItemPrice).not.toHaveBeenCalled()
    fireEvent.blur(input)
    expect(h.setItemPrice).toHaveBeenCalledWith('f1', 'a', 500)
  })

  it('Finalizar calls checkout with market, categories and the typed prices, then goes home', () => {
    renderIt()
    fireEvent.change(screen.getByLabelText(strings.checkout.priceFor('arroz')), {
      target: { value: '5,00' },
    })
    fireEvent.change(screen.getByLabelText(strings.checkout.marketLabel), {
      target: { value: 'Atacadão' },
    })
    fireEvent.click(screen.getByRole('button', { name: strings.checkout.finish }))
    expect(h.checkout).toHaveBeenCalledTimes(1)
    const [fid, bought, opts] = h.checkout.mock.calls[0]!
    expect(fid).toBe('f1')
    expect(bought.map((i: Item) => [i.id, i.priceCents])).toEqual([
      ['a', 500],
      ['b', null],
    ])
    expect(opts).toEqual({ market: 'Atacadão', categories: [{ id: 'c1', name: 'Mercearia' }] })
    expect(screen.getByText('home')).toBeInTheDocument()
  })

  it('S-046 AC5: works with no price and no market', () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.checkout.finish }))
    expect(h.checkout.mock.calls[0]![2].market).toBeNull()
  })

  it('redirects home when nothing is bought', () => {
    h.state.items = [item('c', 'pão', 'pending')]
    renderIt()
    expect(screen.getByText('home')).toBeInTheDocument()
    expect(h.checkout).not.toHaveBeenCalled()
  })
})
