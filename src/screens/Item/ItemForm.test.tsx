import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Item } from '@/data/converters'
import { strings } from '@/strings/pt-BR'
import { ItemForm, parseQuantity } from './ItemForm'

const item: Item = {
  id: 'i1',
  name: 'feijão',
  nameKey: 'feijao',
  quantity: 3,
  unit: 'kg',
  note: null,
  categoryId: null,
  recurring: false,
  status: 'pending',
  markedBy: null,
  markedAt: null,
  priceCents: null,
  createdBy: 'u',
  createdAt: new Date(),
  hasPendingWrites: false,
}
const save = () => screen.getByRole('button', { name: strings.item.save })
const qty = () => screen.getByLabelText(strings.item.quantity)

describe('S-021 AC3: parseQuantity', () => {
  it('accepts decimal comma and dot within (0, 9999]', () => {
    expect(parseQuantity('1,5')).toBe(1.5)
    expect(parseQuantity('2.5')).toBe(2.5)
    expect(parseQuantity('9999')).toBe(9999)
  })
  it('rejects empty, zero, too big and junk', () => {
    for (const v of ['', '  ', '0', '10000', 'abc', '-1']) expect(parseQuantity(v)).toBeNull()
  })
})

describe('S-021 AC2/AC3: ItemForm', () => {
  it('shows current values and sends only changed fields', () => {
    const onSave = vi.fn()
    render(<ItemForm item={item} categories={[]} onSave={onSave} onDelete={vi.fn()} />)
    expect(qty()).toHaveValue('3')
    fireEvent.change(qty(), { target: { value: '1,5' } })
    fireEvent.change(screen.getByLabelText(strings.item.note), { target: { value: 'Camil' } })
    fireEvent.click(screen.getByLabelText(strings.item.recurring))
    fireEvent.click(save())
    expect(onSave).toHaveBeenCalledWith({ quantity: 1.5, note: 'Camil', recurring: true })
  })

  it('disables Salvar with a message for invalid quantity; limits note to 120', () => {
    render(<ItemForm item={item} categories={[]} onSave={vi.fn()} onDelete={vi.fn()} />)
    for (const v of ['', '0', '10000']) {
      fireEvent.change(qty(), { target: { value: v } })
      expect(save()).toBeDisabled()
      expect(screen.getByText(strings.item.quantityInvalid)).toBeVisible()
    }
    expect(screen.getByLabelText(strings.item.note)).toHaveAttribute('maxlength', '120')
  })

  it('S-021 AC4: Apagar asks for confirmation before deleting', () => {
    const onDelete = vi.fn()
    render(<ItemForm item={item} categories={[]} onSave={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: strings.item.delete }))
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: strings.item.confirm }))
    expect(onDelete).toHaveBeenCalled()
  })
})

describe('S-043 AC1/AC2: category select', () => {
  const cats = [
    { id: 'mercearia', name: 'Mercearia', isDefault: true, order: 0 },
    { id: 'laticinios', name: 'Laticínios', isDefault: true, order: 3 },
  ]
  const sel = () => screen.getByLabelText(strings.item.category) as HTMLSelectElement

  it('S-043 AC1: lists Sem categoria + categories in order; orphan id shows Sem categoria', () => {
    render(
      <ItemForm
        item={{ ...item, categoryId: 'apagada' }}
        categories={cats}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(sel().tagName).toBe('SELECT')
    expect(Array.from(sel().options).map((o) => o.textContent)).toEqual([
      strings.noCategory,
      'Mercearia',
      'Laticínios',
    ])
    expect(sel().selectedOptions[0]).toHaveTextContent(strings.noCategory)
  })

  it('S-043 AC2: saving a chosen category sends categoryId; orphan untouched sends nothing', () => {
    const onSave = vi.fn()
    render(<ItemForm item={item} categories={cats} onSave={onSave} onDelete={vi.fn()} />)
    fireEvent.change(sel(), { target: { value: 'laticinios' } })
    fireEvent.click(save())
    expect(onSave).toHaveBeenCalledWith({ categoryId: 'laticinios' })
  })

  it('S-043 AC2: choosing Sem categoria sends null', () => {
    const onSave = vi.fn()
    render(
      <ItemForm
        item={{ ...item, categoryId: 'mercearia' }}
        categories={cats}
        onSave={onSave}
        onDelete={vi.fn()}
      />,
    )
    fireEvent.change(sel(), { target: { value: '' } })
    fireEvent.click(save())
    expect(onSave).toHaveBeenCalledWith({ categoryId: null })
  })
})
