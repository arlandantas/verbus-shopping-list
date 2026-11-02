import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Item } from '@/data/converters'
import { deleteItem, updateItemDetails } from '@/data/items'
import { strings } from '@/strings/pt-BR'
import { EditItemSheet } from './EditItemSheet'

vi.mock('@/app/FamilyProvider', () => ({ useFamily: () => ({ family: null }) }))
vi.mock('@/data/items', () => ({ updateItemDetails: vi.fn(), deleteItem: vi.fn() }))
beforeEach(() => {
  vi.mocked(updateItemDetails).mockClear()
  vi.mocked(deleteItem).mockClear()
})

const item: Item = {
  id: 'i1',
  name: 'feijão',
  nameKey: 'feijao',
  quantity: 3,
  unit: 'kg',
  note: 'Camil',
  categoryId: 'mercearia',
  recurring: true,
  status: 'pending',
  markedBy: null,
  markedAt: null,
  priceCents: null,
  createdBy: 'u',
  createdAt: new Date(),
  hasPendingWrites: false,
}
const cats = [{ id: 'mercearia', name: 'Mercearia', isDefault: true, order: 0 }]
const open = (over: Partial<Item> = {}, onClose = vi.fn()) => {
  render(
    <EditItemSheet familyId="f1" item={{ ...item, ...over }} categories={cats} onClose={onClose} />,
  )
  return onClose
}
const save = () => screen.getByRole('button', { name: strings.item.save })
const price = () => screen.getByLabelText(strings.item.price)
const cart = () => screen.getByLabelText(strings.item.inCart)

describe('S-057 AC1: opens with the current values', () => {
  it('pending item', () => {
    open()
    expect(screen.getByRole('dialog', { name: 'Editar item' })).toBeInTheDocument()
    expect(screen.getByLabelText(strings.item.name)).toHaveValue('feijão')
    expect(screen.getByLabelText(strings.item.quantity)).toHaveValue('3')
    expect(screen.getByLabelText(strings.item.unit)).toHaveValue('kg')
    expect(screen.getByLabelText(strings.item.category)).toHaveValue('mercearia')
    expect(screen.getByLabelText(strings.item.note)).toHaveValue('Camil')
    expect(screen.getByLabelText(strings.item.recurring)).toBeChecked()
    expect(cart()).not.toBeChecked()
    expect(price()).toHaveValue('')
  })
  it('bought item with price', () => {
    open({ status: 'bought', priceCents: 1290 })
    expect(cart()).toBeChecked()
    expect(price()).toHaveValue('12,90')
  })
})

describe('S-057 AC2: footer and closing without saving', () => {
  it('has Apagar, Cancelar and Salvar', () => {
    open()
    expect(screen.getByRole('button', { name: strings.item.delete })).toHaveStyle({
      color: 'var(--md-sys-color-error)',
    })
    expect(screen.getByRole('button', { name: strings.item.cancel })).toBeInTheDocument()
    expect(save()).toBeInTheDocument()
  })
  it.each([
    ['Cancelar', () => fireEvent.click(screen.getByRole('button', { name: strings.item.cancel }))],
    ['close', () => fireEvent.click(screen.getByRole('button', { name: strings.overlay.close }))],
    ['Esc', () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })],
    ['scrim', () => fireEvent.click(screen.getByTestId('scrim'))],
  ])('%s closes without writing', (_n, act) => {
    const onClose = open()
    fireEvent.change(screen.getByLabelText(strings.item.name), { target: { value: 'outro' } })
    act()
    expect(onClose).toHaveBeenCalled()
    expect(updateItemDetails).not.toHaveBeenCalled()
  })
})

describe('S-057 AC4: price and cart are independent (ADR-0022)', () => {
  it('saving only a price on a pending item writes no status', () => {
    const onClose = open()
    fireEvent.change(price(), { target: { value: '18,90' } })
    fireEvent.click(save())
    expect(updateItemDetails).toHaveBeenCalledTimes(1)
    const patch = vi.mocked(updateItemDetails).mock.calls[0]![2]
    expect(patch).toEqual({ priceCents: 1890 })
    expect('status' in patch).toBe(false)
    expect(onClose).toHaveBeenCalled()
  })
  it('toggling the checkbox writes only the status', () => {
    open({ priceCents: 500 })
    fireEvent.click(cart())
    fireEvent.click(save())
    expect(vi.mocked(updateItemDetails).mock.calls[0]![2]).toEqual({ status: 'bought' })
  })
  it('unchecking a bought item writes only the status and keeps the price', () => {
    open({ status: 'bought', priceCents: 500 })
    fireEvent.click(cart())
    fireEvent.click(save())
    expect(vi.mocked(updateItemDetails).mock.calls[0]![2]).toEqual({ status: 'pending' })
  })
  it('clearing the price writes null; no cart helper text', () => {
    open({ priceCents: 500 })
    fireEvent.change(price(), { target: { value: '' } })
    fireEvent.click(save())
    expect(vi.mocked(updateItemDetails).mock.calls[0]![2]).toEqual({ priceCents: null })
    expect(screen.queryByText(/vai para o carrinho/)).toBeNull()
  })
  it('saving without changes writes nothing', () => {
    const onClose = open()
    fireEvent.click(save())
    expect(updateItemDetails).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})

describe('S-057 AC5: Apagar asks for confirmation', () => {
  it('cancel returns to the sheet; confirm deletes and closes', () => {
    const onClose = open()
    fireEvent.click(screen.getByRole('button', { name: strings.item.delete }))
    const dlg = screen.getByRole('dialog', { name: strings.item.confirmDelete('feijão') })
    expect(deleteItem).not.toHaveBeenCalled()
    fireEvent.click(within(dlg).getByRole('button', { name: strings.item.cancel }))
    expect(screen.queryByRole('dialog', { name: strings.item.confirmDelete('feijão') })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Editar item' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.item.delete }))
    fireEvent.click(
      within(screen.getByRole('dialog', { name: strings.item.confirmDelete('feijão') })).getByRole(
        'button',
        { name: strings.item.confirm },
      ),
    )
    expect(deleteItem).toHaveBeenCalledWith('f1', 'i1')
    expect(onClose).toHaveBeenCalled()
  })
})
